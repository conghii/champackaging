import React, { useRef, useEffect, useCallback } from 'react';
import { Upload, CheckCircle, Brain, SlidersHorizontal, Loader2, Clipboard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';

export function Sidebar() {
  const { inputImage, setInputImage, analyzeInputImage, isAnalyzing, dna, updateDnaName } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setInputImage(base64);
      analyzeInputImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // Global paste handler — works anywhere on the page
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) processFile(file);
        return;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Drag-and-drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <aside className="w-80 bg-slate-900/60 backdrop-blur-md border-r border-white/10 flex flex-col z-20 shrink-0 h-screen sticky top-0">
      <div className="p-5 flex flex-col gap-6 flex-1 overflow-y-auto">
        {/* Hidden file input (always present for re-upload) */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {/* Dropzone — only show when no image uploaded */}
        {!inputImage && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Upload className="text-cyan-400 size-4" /> Input Source
            </h2>
            <div
              className="border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50 p-6 flex flex-col items-center justify-center gap-3 hover:border-cyan-400 hover:bg-slate-800/80 transition-all cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="size-10 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:bg-cyan-400/20 transition-colors">
                <Upload className="text-slate-400 group-hover:text-cyan-400 size-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-200">Upload Character</p>
                <p className="text-xs text-slate-500 mt-1">Drag & drop, click, or <span className="text-cyan-400">Ctrl+V</span> to paste</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Image */}
        {inputImage && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Source Preview</h2>
              <div className="flex items-center gap-2">
                {dna && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                    Analyzed
                  </span>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                >
                  Change
                </button>
              </div>
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
              <img
                src={inputImage}
                alt="Preview"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3 pointer-events-none">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-white size-3" />
                  <span className="text-xs text-white font-medium">High Resolution</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI DNA Card */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Brain className="text-indigo-400 size-4" /> AI DNA Analysis
          </h2>
          <div className="bg-slate-800/80 rounded-xl p-4 border border-white/5 relative min-h-[120px]">
            {isAnalyzing && (
              <motion.div
                className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.5)] z-10"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {isAnalyzing ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs gap-2">
                <Loader2 className="animate-spin size-4" /> Analyzing DNA...
              </div>
            ) : dna ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-400 text-xs border border-indigo-500/20">
                    {dna.style}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="size-3 rounded-sm border border-white/20" style={{ backgroundColor: dna.backgroundColorHex }} />
                    BG: {dna.backgroundColorHex}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-rose-500/20 text-rose-400 text-xs border border-rose-500/20 flex items-center gap-1.5">
                    <span className="size-3 rounded-sm border border-white/20" style={{ backgroundColor: dna.textColor }} />
                    Text: {dna.textColor}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-pink-500/20 text-pink-400 text-xs border border-pink-500/20 flex items-center gap-1.5">
                    <span className="size-3 rounded-sm border border-white/20" style={{ backgroundColor: dna.secondaryColor }} />
                    Accent: {dna.secondaryColor}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs border border-amber-500/20">
                    Pattern: {dna.accentPattern}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 text-xs border border-purple-500/20">
                    Brand: {dna.brandingStyle}
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-400 leading-relaxed max-h-[300px] overflow-y-auto scrollbar-hide space-y-1">
                  <div className="flex items-center gap-2 group">
                    <span className="shrink-0">&gt; Name:</span>
                    <input
                      type="text"
                      value={dna.characterName || dna.name || ""}
                      onChange={(e) => updateDnaName(e.target.value)}
                      className="bg-transparent border-b border-dashed border-slate-500/50 focus:border-cyan-500 outline-none text-cyan-400 px-1 py-0.5 w-full hover:bg-white/5 transition-colors"
                      placeholder="Enter character name..."
                    />
                  </div>
                  &gt; Subject: {dna.subject}<br />
                  &gt; Typo: {dna.typographyStyle}<br />
                  &gt; Palette: {dna.colorPalette.slice(0, 5).join(", ")}<br />
                  <span className="text-cyan-400/70">&gt; Expression:</span> <span className="text-slate-300">{dna.expression}</span><br />
                  <span className="text-amber-400/70">&gt; Anatomy:</span> <span className="text-slate-300">{dna.anatomy}</span><br />
                  <span className="text-pink-400/70">&gt; Accessories:</span> <span className="text-slate-300">{dna.accessories}</span><br />
                  <span className="text-purple-400/70">&gt; Tone:</span> <span className="text-slate-300">{dna.emotionalTone}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs italic">
                Upload an image to analyze DNA
              </div>
            )}
          </div>
        </div>

        <button className="w-full py-2.5 rounded-lg border border-slate-600 hover:border-slate-400 text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 mt-auto">
          <SlidersHorizontal className="size-4" />
          Prompt Template Manager
        </button>
      </div>
    </aside>
  );
}
