import React, { createContext, useContext, useState, ReactNode } from "react";
import { CharacterDNA, analyzeImage, generateImage, generateText, morphPrompt } from "../lib/gemini";
import defaultPrompts from "../config/prompts.json";

interface AppContextType {
  inputImage: string | null;
  setInputImage: (image: string) => void;
  dna: CharacterDNA | null;
  updateDnaName: (newName: string) => void;
  isAnalyzing: boolean;
  analyzeInputImage: (image: string) => Promise<void>;

  generatedImages: {
    topLid: string | null;
    side1: string | null;
    side2: string | null;
    side3: string | null;
    side4: string | null;
    marketing: string | null;
    card: string | null;
    sticker: string | null;
    jarLabel: string | null;
    jarLabelNoChar: string | null;
    lidLabel: string | null;
  };
  isGenerating: {
    topLid: boolean;
    side1: boolean;
    side2: boolean;
    side3: boolean;
    side4: boolean;
    marketing: boolean;
    card: boolean;
    sticker: boolean;
    jarLabel: boolean;
    jarLabelNoChar: boolean;
    lidLabel: boolean;
  };
  progress: number;
  generateAll: () => Promise<void>;
  regenerateSide: (side: keyof AppContextType["generatedImages"]) => Promise<void>;

  templates: {
    topLid: string;
    side1: string;
    side2: string;
    side3: string;
    side4: string;
    marketing: string;
    card: string;
    sticker: string;
    jarLabel: string;
    jarLabelNoChar: string;
    lidLabel: string;
  };
  updateTemplate: (side: keyof AppContextType["templates"], newTemplate: string) => void;

  cardText: string | null;
  isGeneratingCardText: boolean;
  generateCardText: () => Promise<void>;
  side4Text: string | null;
  isGeneratingSide4Text: boolean;
  generateSide4Text: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "packaging-ai-templates";

const DEFAULT_TEMPLATES = defaultPrompts;

const TEMPLATE_VERSION = "v81"; // Bump this when prompts.json changes significantly
const VERSION_KEY = "packaging_ai_template_version";

function loadTemplates(): typeof DEFAULT_TEMPLATES {
  try {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    if (savedVersion !== TEMPLATE_VERSION) {
      // Prompts have been updated — clear old cache and use fresh defaults
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, TEMPLATE_VERSION);
      return { ...DEFAULT_TEMPLATES };
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_TEMPLATES, ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load saved templates:", e);
  }
  return { ...DEFAULT_TEMPLATES };
}

function saveTemplates(templates: typeof DEFAULT_TEMPLATES) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.warn("Failed to save templates:", e);
  }
}

export { DEFAULT_TEMPLATES };

export function AppProvider({ children }: { children: ReactNode }) {
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [dna, setDna] = useState<CharacterDNA | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [generatedImages, setGeneratedImages] = useState({
    topLid: null,
    side1: null,
    side2: null,
    side3: null,
    side4: null,
    marketing: null,
    card: null,
    sticker: null,
    jarLabel: null,
    jarLabelNoChar: null,
    lidLabel: null,
  });

  const [isGenerating, setIsGenerating] = useState({
    topLid: false,
    side1: false,
    side2: false,
    side3: false,
    side4: false,
    marketing: false,
    card: false,
    sticker: false,
    jarLabel: false,
    jarLabelNoChar: false,
    lidLabel: false,
  });

  const [templates, setTemplates] = useState(loadTemplates);


  const updateTemplate = (side: keyof typeof templates, newTemplate: string) => {
    setTemplates(prev => {
      const updated = { ...prev, [side]: newTemplate };
      saveTemplates(updated);
      return updated;
    });
  };

  const updateDnaName = (newName: string) => {
    if (dna) {
      setDna({ ...dna, characterName: newName });
    }
  };

  const [progress, setProgress] = useState(0);

  const analyzeInputImage = async (image: string) => {
    setIsAnalyzing(true);
    setInputImage(image);
    try {
      const result = await analyzeImage(image, DEFAULT_TEMPLATES);
      setDna(result.dna);
      console.log("AI DNA:", result.dna);
      console.log("AI Prompts:", Object.entries(result.prompts).map(([k, v]) => `${k}: ${(v as string).length} chars`));
      // Only save prompts that are non-empty
      const mergedPrompts = { ...templates };
      for (const [key, value] of Object.entries(result.prompts)) {
        if (value && (value as string).trim().length > 0) {
          (mergedPrompts as any)[key] = value;
        }
      }
      setTemplates(mergedPrompts);
      saveTemplates(mergedPrompts);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSide = async (side: keyof typeof generatedImages, template: string, aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" | "9:16") => {
    if (!dna) return;

    setIsGenerating(prev => ({ ...prev, [side]: true }));

    try {
      const prompt = morphPrompt(template, dna);
      const imageUrl = await generateImage(prompt, aspectRatio, inputImage || undefined);
      setGeneratedImages(prev => ({ ...prev, [side]: imageUrl }));
      setProgress(prev => Math.min(prev + 16, 100)); // Roughly 100/6
    } catch (error) {
      console.error(`Generation failed for ${String(side)}`, error);
    } finally {
      setIsGenerating(prev => ({ ...prev, [side]: false }));
    }
  };

  const generateAll = async () => {
    if (!dna) return;

    setProgress(0);

    // Sequential execution to avoid rate limits
    const sides = [
      { key: "topLid", template: templates.topLid, ratio: "1:1" },
      { key: "side1", template: templates.side1, ratio: "3:4" },
      { key: "side2", template: templates.side2, ratio: "3:4" },
      { key: "side3", template: templates.side3, ratio: "3:4" },
      { key: "side4", template: templates.side4, ratio: "3:4" },
      { key: "marketing", template: templates.marketing, ratio: "4:3" },
      { key: "card", template: templates.card, ratio: "3:4" },
      { key: "sticker", template: templates.sticker, ratio: "1:1" },
      { key: "jarLabel", template: templates.jarLabel, ratio: "16:9" },
      { key: "jarLabelNoChar", template: templates.jarLabelNoChar, ratio: "16:9" },
      { key: "lidLabel", template: templates.lidLabel, ratio: "1:1" },
    ] as const;

    for (const side of sides) {
      // Check if we should continue (in a real app we might want a cancel flag)
      await generateSide(side.key, side.template, side.ratio as any);

      // Auto-generate text content when card or side4 image is done
      if (side.key === 'card') {
        generateCardTextFn().catch(console.error);
      } else if (side.key === 'side4') {
        generateSide4TextFn().catch(console.error);
      }

      // Add a delay to respect rate limits (1 request per few seconds is safer for image models)
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    setProgress(100);
  };

  const regenerateSide = async (side: keyof typeof generatedImages) => {
    const aspectRatio = side === "topLid" || side === "sticker" || side === "lidLabel" ? "1:1" : side === "marketing" ? "4:3" : side === "jarLabel" || side === "jarLabelNoChar" ? "16:9" : "3:4";
    await generateSide(side, templates[side], aspectRatio);

    // Auto-generate text content alongside the image
    if (side === 'card') {
      generateCardTextFn().catch(console.error);
    } else if (side === 'side4') {
      generateSide4TextFn().catch(console.error);
    }
  };

  const [cardText, setCardText] = useState<string | null>(null);
  const [isGeneratingCardText, setIsGeneratingCardText] = useState(false);
  const [side4Text, setSide4Text] = useState<string | null>(null);
  const [isGeneratingSide4Text, setIsGeneratingSide4Text] = useState(false);

  const generateCardTextFn = async () => {
    if (!dna) return;
    setIsGeneratingCardText(true);
    try {
      const textPrompt = `You are a creative copywriter. Based on this character: a cute kawaii ${dna.subject}.\nGenerate greeting card text with:\n1. TAGLINE: A short punny phrase (3-6 words) related to the character\n2. PARAGRAPH: A heartfelt inspirational paragraph (4-6 sentences) with 2-3 character puns woven in.\n\nFormat your response EXACTLY like this:\nTAGLINE: [your tagline here]\n\nPARAGRAPH: [your paragraph here]`;
      const text = await generateText(textPrompt);
      setCardText(text);
    } catch (error) {
      console.error("Failed to generate card text", error);
    } finally {
      setIsGeneratingCardText(false);
    }
  };

  const generateSide4TextFn = async () => {
    if (!dna) return;
    setIsGeneratingSide4Text(true);
    try {
      const textPrompt = `You are a creative copywriter for product packaging. Based on this character: a cute kawaii ${dna.subject}.\nGenerate content for the back of the box (the "Puns & Legal" side) with:\n1. TITLE: A catchy punny title (2-4 words) related to the character (e.g. "FRY-DAY FEELS" for fries)\n2. PUN PARAGRAPH: A funny, lighthearted 3-4 sentence paragraph that tells a small joke or story about this character using lots of puns.\n\nFormat your response EXACTLY like this:\nTITLE: [your title here]\n\nPUN PARAGRAPH: [your paragraph here]`;
      const text = await generateText(textPrompt);
      setSide4Text(text);
    } catch (error) {
      console.error("Failed to generate side 4 text", error);
    } finally {
      setIsGeneratingSide4Text(false);
    }
  };

  return (
    <AppContext.Provider value={{
      inputImage,
      setInputImage,
      dna,
      updateDnaName,
      isAnalyzing,
      analyzeInputImage,
      generatedImages,
      isGenerating,
      progress,
      generateAll,
      regenerateSide,
      templates,
      updateTemplate,
      cardText,
      isGeneratingCardText,
      generateCardText: generateCardTextFn,
      side4Text,
      isGeneratingSide4Text,
      generateSide4Text: generateSide4TextFn,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
