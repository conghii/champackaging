import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4001;

// GCP Configuration
const project = process.env.GCP_PROJECT_ID || '';
const initialLocation = process.env.GCP_LOCATION || 'us-central1';
const apiKey = process.env.GEMINI_API_KEY || '';

if (!project || !apiKey) {
    console.error("FATAL: GCP_PROJECT_ID or GEMINI_API_KEY is not set in .env");
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Utility to clean and truncate prompts
 */
function cleanPrompt(prompt: string, maxLen: number = 1500): string {
    let cleaned = prompt.replace(/\r?\n|\r/g, " ").replace(/\s\s+/g, ' ').trim();
    if (cleaned.length > maxLen) {
        cleaned = cleaned.substring(0, maxLen) + "... (truncated)";
    }
    return cleaned;
}

/**
 * CALL VERTEX AI (aiplatform.googleapis.com)
 */
async function callVertexREST(modelId: string, payload: any, retryCount: number = 0) {
    const regions = [initialLocation, 'us-east1', 'asia-northeast1', 'global'];
    const currentRegion = regions[retryCount] || 'us-central1';
    const apiVersion = (modelId.includes('preview') || modelId.includes('3.1')) ? 'v1beta1' : 'v1';
    const host = currentRegion === 'global' ? 'us-central1' : currentRegion;
    const url = `https://${host}-aiplatform.googleapis.com/${apiVersion}/projects/${project}/locations/${currentRegion}/publishers/google/models/${modelId}:streamGenerateContent?key=${apiKey}`;

    console.log(`[Vertex] [${retryCount}] Calling ${modelId} at ${currentRegion}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 429) throw new Error("QUOTA_EXCEEDED");
            if (retryCount < regions.length - 1 && (response.status === 404 || response.status === 500)) {
                await delay(500);
                return callVertexREST(modelId, payload, retryCount + 1);
            }
            throw new Error(`Vertex AI Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        let fullText = "";
        if (Array.isArray(data)) {
            for (const chunk of data) {
                const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) fullText += text;
            }
        } else {
            fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
        return fullText;
    } catch (err: any) {
        if (err.message === "QUOTA_EXCEEDED") throw err;
        if (retryCount < regions.length - 1) return callVertexREST(modelId, payload, retryCount + 1);
        throw err;
    }
}

/**
 * CALL GEMINI API (generativelanguage.googleapis.com) - Usually has separate quota
 */
async function callGeminiAIStudioImagen(prompt: string, aspectRatio: string = "1:1") {
    // Both 001 and 002 are common
    const models = ["imagen-3.0-generate-001", "imagen-3.0-fast-generate-001"];

    for (const model of models) {
        console.log(`[AI Studio] Trying ${model}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt }],
                    parameters: { sampleCount: 1, aspectRatio }
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const base64 = data.predictions?.[0]?.bytesBase64Encoded;
                if (base64) return `data:image/png;base64,${base64}`;
            } else {
                const err = await response.text();
                console.warn(`[AI Studio] ${model} failed (${response.status}): ${err.substring(0, 100)}`);
            }
        } catch (e) {
            console.error(`[AI Studio] Network error:`, e);
        }
    }
    throw new Error("AI_STUDIO_EXHAUSTED");
}

/**
 * Extreme model fallback chain for Image Generation
 */
async function callImagenREST(prompt: string, aspectRatio: string = "1:1", referenceImage?: string, attempt: number = 0) {
    // 1. First, try AI Studio (Global Quota) - it's often more generous
    if (attempt === 0) {
        try {
            return await callGeminiAIStudioImagen(cleanPrompt(prompt, 1000), aspectRatio);
        } catch (e) {
            console.warn("[Imagen] AI Studio fallback failed or exhausted. Trying Vertex...");
        }
    }

    const configs = [
        { model: "gemini-3-pro-image-preview", region: "global" },
        { model: "imagen-3.0-fast-generate-001", region: "us-central1" },
        { model: "imagen-3.0-generate-001", region: "us-central1" },
        { model: "imagen-3.0-fast-generate-001", region: "us-east1" },
        { model: "imagen-3.0-generate-001", region: "us-east1" },
        { model: "imagegeneration@006", region: "us-central1" } // The ultimate fallback
    ];

    const configAttempt = attempt > 0 ? attempt - 1 : 0; // Offset since attempt 0 was AI Studio
    if (configAttempt >= configs.length) throw new Error("ALL_MODELS_EXHAUSTED");

    const { model, region } = configs[configAttempt];
    const apiVersion = model.includes('preview') ? 'v1beta1' : 'v1';
    const host = region === 'global' ? 'us-central1' : region;
    const url = `https://${host}-aiplatform.googleapis.com/${apiVersion}/projects/${project}/locations/${region}/publishers/google/models/${model}:predict?key=${apiKey}`;

    console.log(`[Vertex] [Attempt ${configAttempt}] Calling ${model} in ${region}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{
                    prompt: cleanPrompt(prompt, 1500),
                    image: referenceImage ? { bytesBase64Encoded: referenceImage.split(",")[1] || referenceImage } : undefined
                }],
                parameters: { sampleCount: 1, aspectRatio }
            }),
        });

        if (response.ok) {
            const data = await response.json();
            const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
            if (base64Image) return `data:image/png;base64,${base64Image}`;
        } else {
            const errorBody = await response.text();
            console.error(`\n=========================================`);
            console.error(`[Vertex 🛑] Model: ${model} | Region: ${region}`);
            console.error(`Status: ${response.status} ${response.statusText}`);
            console.error(`Error Body:\n${errorBody}`);
            console.error(`=========================================\n`);
        }

        console.warn(`[Vertex] ${model} in ${region} failed (${response.status}). Trying next...`);
        return callImagenREST(prompt, aspectRatio, referenceImage, attempt + 1);
    } catch (err) {
        console.error(`[Vertex] Network catch block error:`, err);
        return callImagenREST(prompt, aspectRatio, referenceImage, attempt + 1);
    }
}

/**
 * Endpoints
 */
app.post('/api/analyze', async (req, res) => {
    try {
        const text = await callVertexREST("gemini-3.1-pro-preview", {
            contents: [{
                role: 'user', parts: [
                    { inlineData: { data: req.body.base64Image.split(",")[1] || req.body.base64Image, mimeType: "image/png" } },
                    { text: req.body.prompt }
                ]
            }],
            generationConfig: { responseMimeType: "application/json" },
        });
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        res.json(JSON.parse(cleanText));
    } catch (error: any) {
        if (error.message === "QUOTA_EXCEEDED") {
            return res.status(429).json({ error: "BẠN ĐÃ HẾT QUOTA ANALYSIS. Vui lòng đợi 1 phút." });
        }
        try {
            const text = await callVertexREST("gemini-2.0-flash-001", {
                contents: [{
                    role: 'user', parts: [
                        { inlineData: { data: req.body.base64Image.split(",")[1] || req.body.base64Image, mimeType: "image/png" } },
                        { text: req.body.prompt }
                    ]
                }],
                generationConfig: { responseMimeType: "application/json" }
            });
            res.json(JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim()));
        } catch (e: any) {
            res.status(500).json({ error: "Analysis failed. Check your GCP project quota." });
        }
    }
});

app.post('/api/generate-image', async (req, res) => {
    try {
        const imageUrl = await callImagenREST(req.body.prompt, req.body.aspectRatio, req.body.referenceImage);
        res.json({ imageUrl });
    } catch (error: any) {
        console.error("[Backend POST /generate-image] Final Error:", error);
        if (error.message.includes("429") || error.message.includes("QUOTA_EXCEEDED")) {
            return res.status(429).json({ error: "HẾT QUOTA: Cả AI Studio và Vertex AI đều báo hết lượt dùng. Vui lòng đợi 1-2 phút rồi thử lại." });
        }
        res.status(500).json({ error: `Lỗi Server: ${error.message}` });
    }
});

app.post('/api/generate-text', async (req, res) => {
    try {
        const text = await callVertexREST("gemini-3.1-pro-preview", {
            contents: [{ role: 'user', parts: [{ text: req.body.prompt }] }]
        });
        res.json({ text: text?.trim() });
    } catch (error: any) {
        try {
            const text = await callVertexREST("gemini-2.0-flash-001", {
                contents: [{ role: 'user', parts: [{ text: req.body.prompt }] }]
            });
            res.json({ text: text?.trim() });
        } catch (e: any) {
            res.status(500).json({ error: "Text generation failed." });
        }
    }
});

app.listen(port, () => {
    console.log(`Vertex Proxy Server running at http://localhost:${port}`);
    console.log(`Dual-Quota Mode (AI Studio + Vertex) Active.`);
});
