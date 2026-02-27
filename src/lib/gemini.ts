import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export interface CharacterDNA {
  style: string;
  subject: string;
  material: string;
  lighting: string;
  colorPalette: string[];
  backgroundColor: string;
  backgroundColorHex: string;
  textColor: string;
  accentPattern: string;
  accentMotif: string;
  typographyStyle: string;
  brandingStyle: string;
  characterName: string;
  // Enhanced DNA fields
  expression: string;
  pose: string;
  anatomy: string;
  accessories: string;
  secondaryColor: string;
  emotionalTone: string;
}

export interface AnalysisResult {
  dna: CharacterDNA;
  prompts: {
    topLid: string;
    side1: string;
    side2: string;
    side3: string;
    side4: string;
    marketing: string;
  };
}

export async function analyzeImage(base64Image: string, templates: AnalysisResult["prompts"]): Promise<AnalysisResult> {
  try {
    const model = "gemini-3-flash-preview";
    const prompt = `You are a SENIOR PACKAGING DESIGNER for the American gift market.

STEP 1 — CHARACTER IDENTIFICATION (DEEP ANALYSIS):
Analyze the uploaded image with EXTREME literal detail. You must identify:
1. SPECIES/TYPE: What is this character? (e.g., duck, nugget, frog, poo)
2. NAME: Determine a catchy name in ALL CAPS (e.g., "DUCKY", "NUGGET", "PICKLE")
3. EXPRESSION: Describe the EXACT facial expression in granular detail:
   - Eye shape, size, and highlights (e.g., "large round eyes with white sparkle highlights, black pupils")
   - Mouth shape (e.g., "wide open smile showing tiny tongue", "small curved smile", "cat-like :3 mouth")
   - Cheek details (e.g., "round rosy pink blush circles on both cheeks")
4. BODY & POSE: Describe the body shape and default stance:
   - Body shape (round, oval, tall, blob-like, etc.)
   - How it sits or stands (flat bottom, tiny feet, floating, etc.)
5. COLORS: List ALL colors visible on the character with exact placement
6. ACCESSORIES: List ANY wearable items (bows, hats, glasses, crowns, scarves — or "none")

STEP 2 — ANATOMY AUDIT (CRITICAL — DO NOT SKIP):
Before proceeding, explicitly answer each question about the character's body:
- Does this character have ARMS? → If yes, describe them (e.g., "two small stubby arms"). If no, write "NO ARMS".
- Does this character have HANDS? → If yes, describe them. If no, write "NO HANDS".
- Does this character have LEGS/FEET? → If yes, describe them (e.g., "two tiny orange webbed feet"). If no, write "NO LEGS".
- Does this character have WINGS? → If yes, describe them. If no, write "NO WINGS".
- Does this character have a TAIL? → If yes, describe it. If no, write "NO TAIL".
- What is the character's overall BODY SHAPE? (e.g., "perfectly round blob", "oval with flat bottom", "teardrop")
- Does the character have any UNUSUAL FEATURES? (e.g., "swirl on top of head", "sprinkles", "steam rising")
This audit is CRITICAL because the image generation AI will use this to avoid adding body parts that don't exist.

STEP 3 — CULTURAL DESIGN REASONING:
Based on the character type you identified, reason about what design elements will resonate BEST with American consumers:
- What colors, patterns, and motifs are culturally associated with this character in America?
- What "vibe" or branding aesthetic fits this character for a fun, giftable product?
- What EMOTIONAL TONE does this character convey? (e.g., "cheerful and silly", "warm and cozy", "sassy and confident")

Examples of expected reasoning (DO NOT copy these literally — reason fresh for each character):
- Duck → rubber duck, bath time, pond → soft sunny yellow BG, playful water-ripple or polka-dot pattern, bubbly rounded fonts, "Playful Bath Toy" vibe
- Elephant → gentle giant, safari, wisdom → soft sky blue or lavender BG, subtle safari leaf pattern, elegant rounded serif font, "Gentle Safari" vibe
- Nugget → comfort food, fast food, diner → warm golden yellow BG, red-and-white checkered/gingham borders, retro diner bold lettering, "Fun Diner Snack" vibe
- Pickle → deli, jar, crunchy humor → fresh green BG, vintage jar label border, hand-drawn quirky font, "Classic Deli" vibe
- Frog → lily pad, pond, rain → pastel green BG, lily pad or raindrop motifs, whimsical script font, "Enchanted Pond" vibe
- Cat → cozy, yarn, playful → soft cream or blush pink BG, paw-print or yarn-ball pattern, cute handwritten font, "Cozy Home" vibe
- Avocado → healthy, trendy, millennial → pastel green/cream BG, minimalist leaf accents, clean modern sans-serif, "Fresh & Trendy" vibe

STEP 4 — GENERATE DNA:
Return a "dna" object with ALL of these fields (use your analysis from Steps 1-3):

--- CORE FIELDS ---
- "style": art style of the character (e.g., "Cute kawaii cartoon", "Flat vector illustration")
- "subject": ULTRA-DETAILED visual blueprint of the character's exact appearance. This is the MASTER description used to recreate the character in every panel, so it must be specific enough to produce a near-identical clone. Include: (a) overall body shape and proportions (e.g., "perfectly round egg-shaped body, 1:1 width-to-height ratio"), (b) exact color placement (e.g., "entirely bright yellow body, white oval belly patch"), (c) facial features with precise geometry (e.g., "two large circular black eyes centered on face, each with a small white circular shine spot at upper-right, flat wide orange diamond-shaped beak, round rosy-pink circular blush marks on both cheeks"), (d) limbs and appendages (e.g., "two tiny stubby yellow wings resting flat against sides of body, two small orange webbed feet at bottom"), (e) art style (e.g., "clean vector kawaii style with thick black outlines and flat cel-shading"). Write this as a SINGLE LONG PARAGRAPH, NOT a short label.
- "characterName": the character's name in ALL CAPS (e.g., "DUCKY", "NUGGET")
- "material": surface finish (e.g., "Matte paper", "Glossy")
- "lighting": lighting setup (e.g., "Flat, even illumination", "Soft studio")

--- COLOR FIELDS ---
- "colorPalette": array of 3-5 hex colors sampled from the character
- "backgroundColor": descriptive name of the background color. CRITICAL: This MUST be a TONE-SUR-TONE pastel of the character's DOMINANT body color. A yellow duck → soft pastel yellow BG. A green frog → soft pastel mint-green BG. A pink pig → soft pastel baby-pink BG. NEVER choose white, gray, or off-white. The background should be an obvious, recognizable tint of the character's main color.
- "backgroundColorHex": EXACT hex code for the background. This must be a CLEARLY TINTED pastel — NOT near-white. Examples: yellow duck → "#FFF4C1" or "#FFFDE0", green frog → "#E0F5E8", pink pig → "#FFE4EC", orange nugget → "#FFF0DB". The hex MUST have visible color saturation.
- "textColor": EXACT hex code for the main text/title color (e.g., "#D4750B"). Choose a DARK, BOLD, SATURATED version of the primary color.
- "secondaryColor": EXACT hex code for a secondary accent color sampled from the character (e.g., cheek blush color, accessory color, or a contrasting detail color). This is used in small decorative elements.

--- CHARACTER DETAIL FIELDS (NEW — CRITICAL FOR IMAGE QUALITY) ---
- "expression": EXACT facial expression description from Step 1. Be very specific about eyes, mouth, and cheeks. Example: "big round sparkly eyes with white highlights, wide happy smile with tiny pink tongue poking out, round rosy-pink blush circles on both cheeks"
- "pose": Default body pose/stance from Step 1. Example: "standing upright on two tiny orange webbed feet, small wings resting at sides, looking straight ahead"
- "anatomy": STRICT body part rules from your Step 2 Anatomy Audit. Format as a checklist: "HAS: [list]. DOES NOT HAVE: [list]. BODY SHAPE: [shape]." Example: "HAS: two small wings, two tiny webbed feet, small round tail. DOES NOT HAVE: arms, hands, fingers. BODY SHAPE: round and plump."
- "accessories": List of wearable items from Step 1, or "none" if the character has no accessories. Example: "small red bow on top of head, tiny golden bell around neck"
- "emotionalTone": The character's personality vibe for copywriting. Example: "cheerful, silly, pun-loving, warm-hearted optimist"

--- DESIGN FIELDS ---
- "accentPattern": the overall DECORATIVE THEME that ties the packaging together, inspired by the character's world and culture. NOT a border — this is the general visual motif language. Examples: Duck → "playful pond/bath-time theme with bubbles and water", Nugget → "retro diner theme with checkered patterns", Frog → "enchanted pond theme with lily pads and raindrops", Cat → "cozy home theme with yarn balls and paw prints". This should be 1 short phrase.
- "accentMotif": SPECIFIC tiny scattered elements to draw faintly in backgrounds. These must be simple, recognizable, cute shapes related to the character. Examples: Duck → "tiny rubber ducks, small bubbles, little water droplets", Nugget → "tiny french fries, small ketchup splashes, mini stars", Frog → "tiny lily pads, small water droplets, little fireflies", Cat → "tiny paw prints, small yarn balls, little fish". List 3 specific drawable items.
- "typographyStyle": THEMATIC LETTERING MASTERPLAN. The text MUST look like it is LITERALLY CONSTRUCTED from the character's actual body parts or ingredients. CRITICAL: Avoid mechanical uniformity. Letters should feel "alive" and hand-crafted. Describe ALL 6 aspects as one vivid paragraph:
  (a) LITERAL CONSTRUCTION: How are the letters physically built? (e.g., for fries → "each letter is built from several rectangular golden-brown potato fries", for taco → "letters are curved crisp taco shells filled with ingredients").
  (b) DYNAMIC MOVEMENT & ORGANIC VARIATION: Every letter must have its own personality. Use playful tilts/rotations, varying sizes, and uneven baselines. CRITICAL: Each letter must be UNIQUE (e.g., for donut → "each letter has a slightly different shape and a unique pattern of colorful sprinkles, no two letters are identical"). No mechanical repetition.
  (c) SURFACE MATERIAL & TEXTURE: (e.g., "bumpy deep-fried skin", "glossy wet rubber", "frosted ice with cracks").
  (d) COLOR TREATMENT: Exact colors + gradients. (e.g., "golden-yellow (#FFD700) with burnt edges").
  (e) 3D DEPTH & EXTRUSION: How it pops. (e.g., "heavy 3D extrusion showing the inside layers").
  (f) VISCERAL EFFECTS: (e.g., "tiny golden salt crystals falling off", "melted cheese stretching between letters").
  CRITICAL: Letters MUST look like the character's materials, but with playful, organic, and non-uniform arrangement. Write as one masterpiece paragraph.
- "brandingStyle": the overall aesthetic vibe (e.g., "Whimsical Encouragement")

STEP 5 — INSTANTIATE TEMPLATES:
Re-write the following templates using your DNA. Replace all placeholders with specific, vivid descriptions.

⚠️ CRITICAL CONSISTENCY RULES (ABSOLUTE — ZERO DEVIATION):
1. EXACT SAME BACKGROUND COLOR: Every single panel MUST specify the EXACT SAME background hex code from your DNA's "backgroundColorHex". Write it as: "solid pastel [color name] (#HEXCODE)". Example: "solid pastel butter-yellow (#FFF4C1)". 
2. EXACT SAME TEXT COLOR: Every panel with colored text MUST use the EXACT SAME hex from your DNA's "textColor". Write it as: "[color name] (#HEXCODE)". Example: "dark burnt orange (#D4750B)".
3. EXACT SAME FONT STYLE: Every panel MUST describe the font with the EXACT SAME words from your DNA's "typographyStyle".
4. EXACT SAME BORDER: Every panel with [ACCENT_PATTERN] MUST use the EXACT SAME border description, making the packaging feel like a cohesive set.
5. SUBJECT FIDELITY: Describe the subject with extreme literal detail from the image. The goal is a PERFECT CLONE.
6. ANATOMY FIDELITY: When describing the character in any panel, ALWAYS include the anatomy constraints from your DNA's "anatomy" field. If the character has NO ARMS, explicitly write "NO arms". If it has wings instead of arms, say "wings" not "arms". This prevents the AI from hallucinating body parts.
7. PLACEHOLDERS (DO NOT FILL): Keep all placeholder tokens in square brackets (e.g. [TÊN NHÂN VẬT VIẾT HOA], [Màu chữ đậm nét], [BG_COLOR], [Họa tiết chìm thưa thớt], [TYPO_STYLE], [Mô tả chi tiết đặc điểm con vật của bạn], [BIỂU CẢM], [TƯ THẾ], [GIẢI PHẪU], [PHỤ KIỆN]) EXACTLY as they are in the templates. DO NOT replace them with final values. The application will fill them dynamically. You should only re-write the surrounding text to be more descriptive and stylistically fitting for the character.
8. TECHNICAL: Preserve all technical keywords like "die-cut ready", "pure flat vector", "2D flat packaging", "8k resolution".
9. STYLE: Keep the overall design language and instruction style of the template exactly as is.

TEMPLATES to transform:
- topLid: ${templates.topLid}
- side1: ${templates.side1}
- side2: ${templates.side2}
- side3: ${templates.side3}
- side4: ${templates.side4}
- marketing: ${templates.marketing}

Return the result in JSON format with "dna" and "prompts" objects.
Return ONLY the JSON.`;

    const base64Data = base64Image.split(",")[1] || base64Image;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanText);

    // Hardening and Mapping
    const dna = parsed.dna || {};
    const rawPrompts = parsed.prompts || {};

    // Ensure colorPalette is always an array of strings
    let colorPalette = dna.colorPalette;
    if (typeof colorPalette === "string") {
      colorPalette = colorPalette.split(",").map((s: string) => s.trim());
    } else if (!Array.isArray(colorPalette)) {
      colorPalette = ["#000000"];
    }

    // Map keys strictly to avoid casing/format issues from Gemini
    // Fallback to original templates if AI returns empty prompts for any side
    const prompts = {
      topLid: rawPrompts.topLid || rawPrompts.top_lid || rawPrompts.topLid || templates.topLid,
      side1: rawPrompts.side1 || rawPrompts.side_1 || templates.side1,
      side2: rawPrompts.side2 || rawPrompts.side_2 || templates.side2,
      side3: rawPrompts.side3 || rawPrompts.side_3 || templates.side3,
      side4: rawPrompts.side4 || rawPrompts.side_4 || templates.side4,
      marketing: rawPrompts.marketing || templates.marketing,
    };

    return {
      dna: {
        style: dna.style || "Premium",
        subject: dna.subject || "Subject",
        characterName: dna.characterName || dna.character_name || "CHARACTER",
        material: dna.material || "Matte",
        lighting: dna.lighting || "Studio",
        colorPalette,
        backgroundColor: dna.backgroundColor || dna.background_color || "white",
        backgroundColorHex: dna.backgroundColorHex || dna.background_color_hex || "#FFFFFF",
        textColor: dna.textColor || dna.text_color || "#333333",
        accentPattern: dna.accentPattern || dna.accent_pattern || "none",
        accentMotif: dna.accentMotif || dna.accent_motif || "small decorative shapes",
        typographyStyle: dna.typographyStyle || dna.typography_style || "standard",
        brandingStyle: dna.brandingStyle || dna.branding_style || "modern",
        // Enhanced DNA fields
        expression: dna.expression || dna.facial_expression || "cute kawaii expression with big sparkly eyes and warm smile",
        pose: dna.pose || dna.default_pose || "standing upright, centered",
        anatomy: dna.anatomy || dna.body_parts || "standard kawaii body",
        accessories: dna.accessories || "none",
        secondaryColor: dna.secondaryColor || dna.secondary_color || dna.colorPalette?.[1] || "#FF9999",
        emotionalTone: dna.emotionalTone || dna.emotional_tone || "cheerful and warm",
      },
      prompts,
    };
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}

export async function generateImage(prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" | "9:16" = "1:1", referenceImage?: string, retries = 5): Promise<string> {
  try {
    const model = "gemini-2.5-flash-image";

    // Build contents: include reference image if available
    let contents: any;
    if (referenceImage) {
      const base64Data = referenceImage.split(",")[1] || referenceImage;
      // CRITICAL: Frame the reference image as a STRONG visual guide
      const framedPrompt = `TASK: Generate a NEW image following the design instructions below.\n` +
        `CRITICAL — CHARACTER VISUAL FIDELITY: The attached image is the DEFINITIVE character reference. ` +
        `The character you draw MUST visually match this reference as closely as possible — same body shape, same proportions, same colors, same facial features, same art style, same line weight. ` +
        `Treat this image as the CHARACTER MODEL SHEET. Any character in your output must look like it was drawn by the same artist.\n\n` +
        `DESIGN INSTRUCTIONS:\n${prompt}`;
      contents = [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Data,
          },
        },
        { text: framedPrompt },
      ];
    } else {
      contents = prompt;
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseModalities: ['Image', 'Text'],
        imageConfig: {
          aspectRatio,
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (part && part.inlineData && part.inlineData.data) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }

    // Log what the model actually returned for debugging
    const textParts = response.candidates?.[0]?.content?.parts?.filter(p => p.text);
    if (textParts && textParts.length > 0) {
      console.warn("Model returned text instead of image:", textParts.map(p => p.text).join("\n"));
    }
    console.warn("Full response structure:", JSON.stringify(response.candidates?.[0]?.content?.parts?.map(p => ({ hasText: !!p.text, hasInlineData: !!p.inlineData }))));

    throw new Error("No image generated");
  } catch (error: any) {
    console.error("Error generating image:", error);

    const isRetryable =
      error.status === 429 ||
      error.message?.includes("429") ||
      error.message?.includes("quota") ||
      error.status === "RESOURCE_EXHAUSTED" ||
      error.message?.includes("fetch") ||
      error.message?.includes("timeout") ||
      error.message === "No image generated";

    if (retries > 0 && isRetryable) {
      const baseDelay = Math.pow(2, 6 - retries) * 1000;
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;

      console.log(`Retryable error (${error.message || error.status}). Retrying in ${Math.round(delay)}ms... (Attempts left: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateImage(prompt, aspectRatio, referenceImage, retries - 1);
    }

    throw error;
  }
}

export async function generateText(prompt: string, retries = 3): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const text = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
    if (text) return text.trim();
    throw new Error("No text generated");
  } catch (error: any) {
    console.error("Error generating text:", error);

    const isRetryable =
      error.status === 429 ||
      error.message?.includes("429") ||
      error.message?.includes("quota") ||
      error.status === "RESOURCE_EXHAUSTED" ||
      error.message?.includes("fetch");

    if (retries > 0 && isRetryable) {
      const baseDelay = Math.pow(2, 4 - retries) * 1000;
      const jitter = Math.random() * 500;
      const delay = baseDelay + jitter;

      console.log(`Text generation retryable error. Retrying in ${Math.round(delay)}ms... (Attempts left: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateText(prompt, retries - 1);
    }
    throw error;
  }
}

export function morphPrompt(template: string, dna: CharacterDNA): string {
  if (!template) return "";
  let prompt = template;

  // Replace any remaining tags (may be no-op if AI already instantiated)
  prompt = prompt.replaceAll("[SUBJECT]", dna.subject);
  prompt = prompt.replaceAll("[STYLE]", dna.style);
  prompt = prompt.replaceAll("[MATERIAL]", dna.material);
  prompt = prompt.replaceAll("[LIGHTING]", dna.lighting);
  prompt = prompt.replaceAll("[BG_COLOR]", `${dna.backgroundColorHex}`);
  prompt = prompt.replaceAll("[ACCENT_PATTERN]", dna.accentPattern);
  prompt = prompt.replaceAll("[Họa tiết chìm thưa thớt]", dna.accentMotif);
  prompt = prompt.replaceAll("[TYPO_STYLE]", dna.typographyStyle);
  prompt = prompt.replaceAll("[BRAND_STYLE]", dna.brandingStyle);
  prompt = prompt.replaceAll("[NAME]", dna.characterName.toUpperCase());
  prompt = prompt.replaceAll("[TÊN]", dna.characterName.toUpperCase());
  prompt = prompt.replaceAll("[TÊN NHÂN VẬT VIẾT HOA]", dna.characterName.toUpperCase());
  prompt = prompt.replaceAll("[Mô tả chi tiết đặc điểm con vật của bạn]", dna.subject);
  prompt = prompt.replaceAll("[Màu chữ đậm nét]", `${dna.textColor}`);
  // Enhanced DNA replacements
  prompt = prompt.replaceAll("[BIỂU CẢM]", dna.expression);
  prompt = prompt.replaceAll("[TƯ THẾ]", dna.pose);
  prompt = prompt.replaceAll("[GIẢI PHẪU]", dna.anatomy);
  prompt = prompt.replaceAll("[PHỤ KIỆN]", dna.accessories);

  // Prepend a strict color-lock + anatomy-lock preamble for image generation consistency
  const colorLock = `[CRITICAL MANDATORY COLOR RULES — DO NOT DEVIATE]\n` +
    `Background fill: EXACTLY ${dna.backgroundColorHex}. Fill the ENTIRE background with this SINGLE SOLID FLAT color. ZERO gradients, ZERO variation, ZERO patterns.\n` +
    `Title/heading text color: EXACTLY ${dna.textColor}.\n` +
    `These colors are ABSOLUTE for all packaging panels. Use the hex code exactly as provided.\n\n`;

  const anatomyLock = `[MANDATORY ANATOMY RULES — DO NOT DEVIATE]\n` +
    `Character anatomy: ${dna.anatomy}\n` +
    `Character expression: ${dna.expression}\n` +
    `Character accessories: ${dna.accessories}\n` +
    `DO NOT add body parts that the character does not have. Follow the anatomy description EXACTLY.\n\n`;

  prompt = colorLock + anatomyLock + prompt;

  if (dna.colorPalette && dna.colorPalette.length > 0) {
    prompt += `. Color palette: ${dna.colorPalette.join(", ")}.`;
  }
  return prompt;
}

/**
 * Use AI to refine/modify an existing prompt based on a user hint.
 * e.g. hint = "change red text to yellow" → modifies the prompt accordingly.
 */
export async function refinePrompt(currentPrompt: string, hint: string): Promise<string> {
  try {
    const isReprompt = !hint || hint.trim() === "";

    // Different instructions depending on whether user provided a hint, or just clicked REPROMPT
    const systemInstruction = isReprompt
      ? `You are a creative packaging prompt engineer. The user wants to RE-IMAGINE or OPTIMIZE the current prompt without specific instructions.\n\n` +
      `CURRENT PROMPT:\n---\n${currentPrompt}\n---\n\n` +
      `YOUR TASK:\nRewrite the prompt to make it more creative, detailed, or visually interesting. You can change the layout, the actions, the vibe, or add new elements, but keep the core subject and technical modifiers (8k, vector, etc.). Return ONLY the new prompt text.`
      : `You are a prompt editor. You will receive a packaging design prompt and a modification request from the user.\n\n` +
      `CURRENT PROMPT:\n---\n${currentPrompt}\n---\n\n` +
      `USER'S MODIFICATION REQUEST:\n"${hint}"\n\n` +
      `YOUR TASK:\nApply the user's modification to the prompt. Return ONLY the modified prompt text — no explanations, no markdown, no code blocks, no quotes. Just the raw modified prompt text.\n\nRULES:\n- Keep the overall structure and length of the prompt the same\n- Only change the parts that the user's hint refers to\n- Preserve all technical keywords (8k resolution, flat vector, etc.)\n- If the user mentions a color change, update ALL references to that color in the prompt\n- Return the complete modified prompt, not just the changed parts`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: systemInstruction,
    });

    const refined = response.text?.trim();
    if (!refined) throw new Error("No response from refine");
    return refined;
  } catch (error) {
    console.error("Error refining prompt:", error);
    throw error;
  }
}
