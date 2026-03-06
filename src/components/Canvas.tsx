import React, { useState, useEffect } from 'react';
import { RefreshCw, ZoomIn, ZoomOut, Layers, Edit, MoreHorizontal, Loader2, X, Download, Save, RotateCcw, Box, Sparkles } from 'lucide-react';
import { useApp, DEFAULT_TEMPLATES } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { refinePrompt, morphPrompt } from '../lib/gemini';

function Lightbox({ image, label, onClose }: { image: string; label: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
          <img
            src={image}
            alt={label}
            className="max-w-[85vw] max-h-[80vh] object-contain"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-white bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            {label}
          </span>
          <a
            href={image}
            download={`${label}.png`}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
            title="Download"
          >
            <Download className="size-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-red-500/50 text-white transition-colors border border-white/10"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const VARIABLES = [
  { tag: '[SUBJECT]', desc: 'Character / subject name', color: 'cyan' },
  { tag: '[STYLE]', desc: 'Art style (e.g. Cartoon, 3D)', color: 'indigo' },
  { tag: '[BG_COLOR]', desc: 'Background matching color', color: 'emerald' },
  { tag: '[ACCENT_PATTERN]', desc: 'Design patterns/borders', color: 'amber' },
  { tag: '[TYPO_STYLE]', desc: 'Typography & font style', color: 'purple' },
  { tag: '[BRAND_STYLE]', desc: 'Overall branding vibe', color: 'rose' },
];

const VAR_COLORS: Record<string, string> = {
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
};

function PromptEditorModal({
  side,
  label,
  template,
  onClose,
  onSave,
  onRegen,
  isGenerating
}: {
  side: keyof typeof DEFAULT_TEMPLATES;
  label: string;
  template: string;
  onClose: () => void;
  onSave: (side: keyof typeof DEFAULT_TEMPLATES, value: string) => void;
  onRegen: (side: keyof typeof DEFAULT_TEMPLATES) => void;
  isGenerating: boolean;
}) {
  const [localValue, setLocalValue] = useState(template);
  const [hasChanges, setHasChanges] = useState(false);
  const [hint, setHint] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const { dna } = useApp();

  useEffect(() => {
    setLocalValue(template);
    setHasChanges(false);
  }, [template]);

  const handleSave = () => {
    onSave(side, localValue);
    setHasChanges(false);
  };

  const handleRefine = async () => {
    if (!hint.trim()) return;
    setIsRefining(true);
    try {
      const refined = await refinePrompt(localValue, hint.trim());
      setLocalValue(refined);
      setHasChanges(refined !== template);
      setHint('');
    } catch (err) {
      console.error('Failed to refine prompt:', err);
    } finally {
      setIsRefining(false);
    }
  };

  const insertVariable = (tag: string) => {
    setLocalValue(prev => prev + ' ' + tag);
    setHasChanges(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Edit className="size-4" />
            </div>
            <div>
              <h3 className="text-white font-bold leading-none">{label}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Prompt Editor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="space-y-2 flex flex-col h-full mt-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${activeTab === 'edit' ? 'text-indigo-400 border-indigo-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                >
                  Edit Template
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${activeTab === 'preview' ? 'text-indigo-400 border-indigo-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                >
                  Preview Output
                </button>
              </div>

              {activeTab === 'edit' && (
                <div className="flex gap-1.5 text-[10px]">
                  {VARIABLES.map(v => (
                    <button
                      key={v.tag}
                      onClick={() => insertVariable(v.tag)}
                      className={`px-2 py-0.5 rounded border transition-all ${VAR_COLORS[v.color]}`}
                      title={v.desc}
                    >
                      {v.tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex-1">
              {activeTab === 'edit' ? (
                <textarea
                  value={localValue}
                  onChange={(e) => {
                    setLocalValue(e.target.value);
                    setHasChanges(e.target.value !== template);
                  }}
                  className="w-full h-56 bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
                  placeholder="Enter prompt instructions for this section..."
                />
              ) : (
                <div className="w-full h-56 bg-slate-950/80 border border-indigo-500/20 rounded-xl p-4 overflow-y-auto">
                  {dna ? (
                    <p className="text-xs text-indigo-100 font-mono leading-relaxed whitespace-pre-wrap">
                      {morphPrompt(localValue, dna)}
                    </p>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                      <Box className="size-6 opacity-50" />
                      <p className="text-xs">Analyze a product image first to see the morphed prompt.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hint Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="size-3" /> Quick Modify
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRefining && hint.trim()) {
                    handleRefine();
                  }
                }}
                className="flex-1 bg-slate-950/50 border border-amber-500/20 rounded-lg px-4 py-2.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                placeholder="e.g. change red text to yellow, make character bigger, add sparkles..."
                disabled={isRefining}
              />
              <button
                onClick={handleRefine}
                disabled={isRefining || !hint.trim()}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap ${hint.trim() && !isRefining
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                  : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                  }`}
              >
                {isRefining ? (
                  <><Loader2 className="size-3.5 animate-spin" /> Applying...</>
                ) : (
                  <><Sparkles className="size-3.5" /> APPLY</>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const def = DEFAULT_TEMPLATES[side];
                setLocalValue(def);
                onSave(side, def);
                setHasChanges(false);
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RotateCcw className="size-3.5" /> Reset Default
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefine}
                disabled={isRefining}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg border transition-all ${!isRefining
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                  : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                  }`}
              >
                {isRefining ? (
                  <><Loader2 className="size-3.5 animate-spin" /> ...</>
                ) : (
                  <><Sparkles className="size-3.5" /> REPROMPT</>
                )}
              </button>
              <button
                onClick={() => onRegen(side)}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg border border-white/5 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${isGenerating ? 'animate-spin' : ''}`} /> REGENERATE
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-lg transition-all ${hasChanges ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-slate-700 opacity-50 cursor-not-allowed'
                  }`}
              >
                <Save className="size-3.5" /> SAVE CHANGES
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-indigo-500/5 border-t border-white/5 text-[10px] text-slate-500">
          <p className="flex items-center gap-2">
            <span className="text-indigo-400 font-bold uppercase">Pro Tip:</span>
            Use ✨ Quick Modify to describe changes in plain language — AI will update the prompt for you.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

const SIDE_LABELS: Record<string, string> = {
  topLid: '🔝 Top Lid',
  side1: '📦 Side 1: Front',
  side2: '📦 Side 2: Collection',
  side3: '📦 Side 3: Features',
  side4: '⚖️ Side 4: Legal',
  marketing: '📸 Marketing Mockup',
  card: '💌 Greeting Card',
  sticker: '🏷️ Sticker',
  jarLabel: '🍯 Jar Body Label',
  jarLabelNoChar: '🏷️ Jar Label (Text Only)',
  lidLabel: '🔵 Lid Label',
};

export function Canvas() {
  const { generatedImages, isGenerating, regenerateSide, templates, updateTemplate, cardText, isGeneratingCardText, generateCardText, side4Text, isGeneratingSide4Text, generateSide4Text, generateAll } = useApp();

  const [lightbox, setLightbox] = useState<{ image: string; label: string } | null>(null);
  const [editingSide, setEditingSide] = useState<keyof typeof DEFAULT_TEMPLATES | null>(null);

  const sides = [
    { key: 'side1', label: SIDE_LABELS.side1, ratio: 'aspect-[3/4]' },
    { key: 'side2', label: SIDE_LABELS.side2, ratio: 'aspect-[3/4]' },
    { key: 'side3', label: SIDE_LABELS.side3, ratio: 'aspect-[3/4]' },
    { key: 'side4', label: SIDE_LABELS.side4, ratio: 'aspect-[3/4]' },
  ] as const;

  const handleImageClick = (key: keyof typeof generatedImages, label: string) => {
    const image = generatedImages[key];
    if (image) {
      setLightbox({ image, label });
    }
  };

  const handleDownloadAll = async () => {
    const imagesToDownload = Object.entries(generatedImages)
      .filter(([_, url]) => url !== null)
      .map(([key, url]) => ({ key, url }));

    if (imagesToDownload.length === 0) return;

    for (const { key, url } of imagesToDownload) {
      const link = document.createElement('a');
      link.href = url as string;
      link.download = `${SIDE_LABELS[key] || key}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  return (
    <>
      <section className="flex-1 flex flex-col relative z-10 min-w-0 bg-slate-900 overflow-hidden">
        {/* Scrollable Grid Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
            {/* Global Action Buttons */}
            <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-white/5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="size-4 text-indigo-400" />
                Packaging AI Studio
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={generateAll}
                  disabled={Object.values(isGenerating).some(Boolean)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`size-3.5 ${Object.values(isGenerating).some(Boolean) ? 'animate-spin' : ''}`} />
                  GENERATE ALL
                </button>
                <button
                  onClick={handleDownloadAll}
                  disabled={!Object.values(generatedImages).some(url => url !== null)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-lg shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="size-3.5" />
                  DOWNLOAD ALL
                </button>
              </div>
            </div>

            {/* Top Row: Top Lid + Marketing Mockup - Small size for hierarchy */}
            <div className="max-w-2xl mx-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                {/* Top Lid */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-mono">{SIDE_LABELS.topLid}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => regenerateSide('topLid')}
                        disabled={isGenerating.topLid}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                        title="Quick Regenerate"
                      >
                        <RefreshCw className={`size-3 ${isGenerating.topLid ? 'animate-spin' : ''}`} /> Regen
                      </button>
                      <button
                        onClick={() => setEditingSide('topLid')}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                      >
                        <Edit className="size-3" /> Edit Prompt
                      </button>
                    </div>
                  </div>
                  <div
                    className="aspect-square w-full rounded-xl bg-slate-800/50 border border-slate-600/50 relative overflow-hidden group hover:border-cyan-400/50 transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10"
                    onClick={() => handleImageClick('topLid', SIDE_LABELS.topLid)}
                  >
                    {generatedImages.topLid ? (
                      <img src={generatedImages.topLid} alt="Top Lid" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <Layers className="text-slate-600 size-10 group-hover:text-cyan-400 transition-colors" />
                        <button
                          onClick={(e) => { e.stopPropagation(); regenerateSide('topLid'); }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="size-3" /> GEN
                        </button>
                      </div>
                    )}

                    {isGenerating.topLid && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-black/60 backdrop-blur-md rounded-lg px-4 py-2.5 border border-white/5 flex items-center gap-2">
                          <Loader2 className="animate-spin text-cyan-400 size-4" />
                          <span className="text-xs text-slate-300">Generating...</span>
                        </div>
                      </div>
                    )}

                    {generatedImages.topLid && !isGenerating.topLid && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]">
                        <div className="bg-black/50 backdrop-blur-md rounded-full p-3 border border-white/10">
                          <ZoomIn className="size-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Marketing Mockup */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-mono">{SIDE_LABELS.marketing}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => regenerateSide('marketing')}
                        disabled={isGenerating.marketing}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                        title="Quick Regenerate"
                      >
                        <RefreshCw className={`size-3 ${isGenerating.marketing ? 'animate-spin' : ''}`} /> Regen
                      </button>
                      <button
                        onClick={() => setEditingSide('marketing')}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                      >
                        <Edit className="size-3" /> Edit Prompt
                      </button>
                    </div>
                  </div>
                  <div
                    className="aspect-square w-full rounded-xl bg-slate-800/50 border border-slate-600/50 relative overflow-hidden group hover:border-indigo-400/50 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10"
                    onClick={() => handleImageClick('marketing', SIDE_LABELS.marketing)}
                  >
                    {generatedImages.marketing ? (
                      <img src={generatedImages.marketing} alt="Marketing Mockup" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <MoreHorizontal className="text-slate-600 size-10 group-hover:text-indigo-400 transition-colors opacity-50" />
                        <button
                          onClick={(e) => { e.stopPropagation(); regenerateSide('marketing'); }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="size-3" /> GEN
                        </button>
                      </div>
                    )}

                    {isGenerating.marketing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-black/60 backdrop-blur-md rounded-lg px-4 py-2.5 border border-white/5 flex items-center gap-2">
                          <Loader2 className="animate-spin text-cyan-400 size-4" />
                          <span className="text-xs text-slate-300">Generating...</span>
                        </div>
                      </div>
                    )}

                    {generatedImages.marketing && !isGenerating.marketing && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]">
                        <div className="bg-black/50 backdrop-blur-md rounded-full p-3 border border-white/10">
                          <ZoomIn className="size-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panels: 4-column responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
              {sides.map((side) => (
                <div key={side.key} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{side.label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => regenerateSide(side.key)}
                        disabled={isGenerating[side.key]}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1 py-0.5 rounded-md hover:bg-white/5"
                        title="Quick Regenerate"
                      >
                        <RefreshCw className={`size-2.5 ${isGenerating[side.key] ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => setEditingSide(side.key)}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1 py-0.5 rounded-md hover:bg-white/5"
                      >
                        <Edit className="size-2.5" /> Edit
                      </button>
                    </div>
                  </div>

                  <div
                    className={`${side.ratio} w-full rounded-xl bg-slate-800/30 border border-slate-700/50 relative overflow-hidden group hover:border-slate-500 transition-all shadow-lg cursor-pointer hover:shadow-indigo-500/5`}
                    onClick={() => handleImageClick(side.key, side.label)}
                  >
                    <AnimatePresence mode="wait">
                      {generatedImages[side.key] ? (
                        <motion.img
                          key="image"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          src={generatedImages[side.key]!}
                          alt={side.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full flex flex-col items-center justify-center gap-4 group"
                        >
                          <div className="w-full h-full flex flex-col p-4 gap-2 opacity-30 absolute inset-0">
                            <div className="w-full h-1/2 bg-slate-700/30 rounded"></div>
                            <div className="w-3/4 h-4 bg-slate-700/30 rounded"></div>
                            <div className="w-1/2 h-4 bg-slate-700/30 rounded"></div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); regenerateSide(side.key); }}
                            className="relative z-10 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-110 transition-all flex items-center gap-2"
                          >
                            <RefreshCw className="size-3" /> GEN
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {isGenerating[side.key] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10">
                        <div className="bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 border border-white/5 flex items-center gap-2">
                          <Loader2 className="animate-spin text-cyan-400 size-3" />
                          <span className="text-xs text-slate-300">Generating...</span>
                        </div>
                      </div>
                    )}

                    {generatedImages[side.key] && !isGenerating[side.key] && (
                      <>
                        {/* Zoom overlay on hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px] z-10">
                          <div className="bg-black/50 backdrop-blur-md rounded-full p-3 border border-white/10">
                            <ZoomIn className="size-5 text-white" />
                          </div>
                        </div>
                        {/* Bottom actions */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-200 z-20">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); regenerateSide(side.key); }}
                              className="w-full py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                              <RefreshCw className={`size-3 ${isGenerating[side.key] ? 'animate-spin' : ''}`} /> Regen
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Side 4 Text Generator (Only for side4) */}
                  {side.key === 'side4' && (
                    <div className="mt-2 pl-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Box className="size-3 text-indigo-400 opacity-70" />
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Side 4: Puns & Legal Text</span>
                        </div>
                        <button
                          onClick={() => generateSide4Text()}
                          disabled={isGeneratingSide4Text}
                          className="text-[10px] text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5 border border-transparent hover:border-white/10"
                        >
                          <RefreshCw className={`size-3 ${isGeneratingSide4Text ? 'animate-spin' : ''}`} />
                          {isGeneratingSide4Text ? 'Generating...' : 'Gen Text'}
                        </button>
                      </div>
                      {side4Text ? (
                        <div className="relative group/textbox">
                          <pre className="text-[11px] text-slate-300 bg-slate-950/40 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed border border-slate-700/50 max-h-48 overflow-y-auto scrollbar-hide select-all">{side4Text}</pre>
                          <button
                            onClick={() => { navigator.clipboard.writeText(side4Text); }}
                            className="absolute top-2 right-2 p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-all opacity-0 group-hover/textbox:opacity-100 border border-white/5"
                            title="Copy to clipboard"
                          >
                            <Layers className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-600 italic px-1 bg-slate-950/20 rounded-lg py-3 border border-dashed border-white/5 text-center">
                          Bấm "Gen Text" để tạo nội dung chữ cho mặt lưng
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Brand Assets Row: Card + Sticker */}
            <div className="max-w-3xl mx-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Greeting Card */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-mono">{SIDE_LABELS.card}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => regenerateSide('card')}
                        disabled={isGenerating.card}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                        title="Quick Regenerate"
                      >
                        <RefreshCw className={`size-3 ${isGenerating.card ? 'animate-spin' : ''}`} /> Regen
                      </button>
                      <button
                        onClick={() => setEditingSide('card')}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                      >
                        <Edit className="size-3" /> Edit Prompt
                      </button>
                    </div>
                  </div>
                  <div
                    className="aspect-[3/4] w-full rounded-xl bg-slate-800/50 border border-slate-600/50 relative overflow-hidden group hover:border-pink-400/50 transition-all cursor-pointer shadow-lg hover:shadow-pink-500/10"
                    onClick={() => handleImageClick('card', SIDE_LABELS.card)}
                  >
                    {generatedImages.card ? (
                      <img src={generatedImages.card} alt="Greeting Card" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <Layers className="text-slate-600 size-10 group-hover:text-pink-400 transition-colors" />
                        <button
                          onClick={(e) => { e.stopPropagation(); regenerateSide('card'); }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="size-3" /> GEN
                        </button>
                      </div>
                    )}

                    {isGenerating.card && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-black/60 backdrop-blur-md rounded-lg px-4 py-2.5 border border-white/5 flex items-center gap-2">
                          <Loader2 className="animate-spin text-cyan-400 size-4" />
                          <span className="text-xs text-slate-300">Generating...</span>
                        </div>
                      </div>
                    )}

                    {generatedImages.card && !isGenerating.card && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]">
                        <div className="bg-black/50 backdrop-blur-md rounded-full p-3 border border-white/10">
                          <ZoomIn className="size-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Text Generator */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Card Text</span>
                      <button
                        onClick={() => generateCardText()}
                        disabled={isGeneratingCardText}
                        className="text-[10px] text-slate-500 hover:text-pink-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                      >
                        <RefreshCw className={`size-3 ${isGeneratingCardText ? 'animate-spin' : ''}`} />
                        {isGeneratingCardText ? 'Generating...' : 'Gen Text'}
                      </button>
                    </div>
                    {cardText ? (
                      <div className="relative">
                        <pre className="text-[11px] text-slate-300 bg-slate-800/80 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed border border-slate-600/50 max-h-48 overflow-y-auto">{cardText}</pre>
                        <button
                          onClick={() => { navigator.clipboard.writeText(cardText); }}
                          className="absolute top-2 right-2 p-1 bg-slate-700/80 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-colors"
                          title="Copy to clipboard"
                        >
                          <Layers className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-600 italic px-1">Bấm "Gen Text" để tạo text cho thiệp</div>
                    )}
                  </div>
                </div>

                {/* Sticker */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-mono">{SIDE_LABELS.sticker}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => regenerateSide('sticker')}
                        disabled={isGenerating.sticker}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                        title="Quick Regenerate"
                      >
                        <RefreshCw className={`size-3 ${isGenerating.sticker ? 'animate-spin' : ''}`} /> Regen
                      </button>
                      <button
                        onClick={() => setEditingSide('sticker')}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                      >
                        <Edit className="size-3" /> Edit Prompt
                      </button>
                    </div>
                  </div>
                  <div
                    className="aspect-square w-full rounded-xl bg-slate-800/50 border border-slate-600/50 relative overflow-hidden group hover:border-amber-400/50 transition-all cursor-pointer shadow-lg hover:shadow-amber-500/10"
                    onClick={() => handleImageClick('sticker', SIDE_LABELS.sticker)}
                  >
                    {generatedImages.sticker ? (
                      <img src={generatedImages.sticker} alt="Sticker" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <Layers className="text-slate-600 size-10 group-hover:text-amber-400 transition-colors" />
                        <button
                          onClick={(e) => { e.stopPropagation(); regenerateSide('sticker'); }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="size-3" /> GEN
                        </button>
                      </div>
                    )}

                    {isGenerating.sticker && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-black/60 backdrop-blur-md rounded-lg px-4 py-2.5 border border-white/5 flex items-center gap-2">
                          <Loader2 className="animate-spin text-cyan-400 size-4" />
                          <span className="text-xs text-slate-300">Generating...</span>
                        </div>
                      </div>
                    )}

                    {generatedImages.sticker && !isGenerating.sticker && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]">
                        <div className="bg-black/50 backdrop-blur-md rounded-full p-3 border border-white/10">
                          <ZoomIn className="size-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Jar Labels */}
            <div className="max-w-3xl mx-auto w-full">
              <div className="grid grid-cols-3 gap-6">
                {/* Jar Body Label - takes 2/3 */}
                <div className="col-span-2 flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-mono">{SIDE_LABELS.jarLabel}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => regenerateSide('jarLabel')}
                        disabled={isGenerating.jarLabel}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                        title="Quick Regenerate"
                      >
                        <RefreshCw className={`size-3 ${isGenerating.jarLabel ? 'animate-spin' : ''}`} /> Regen
                      </button>
                      <button
                        onClick={() => setEditingSide('jarLabel')}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                      >
                        <Edit className="size-3" /> Edit Prompt
                      </button>
                    </div>
                  </div>
                  <div
                    className="aspect-video w-full rounded-xl bg-slate-800/50 border border-slate-600/50 relative overflow-hidden group hover:border-teal-400/50 transition-all cursor-pointer shadow-lg hover:shadow-teal-500/10"
                    onClick={() => handleImageClick('jarLabel', SIDE_LABELS.jarLabel)}
                  >
                    {generatedImages.jarLabel ? (
                      <img src={generatedImages.jarLabel} alt="Jar Body Label" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <Layers className="text-slate-600 size-10 group-hover:text-teal-400 transition-colors" />
                        <button
                          onClick={(e) => { e.stopPropagation(); regenerateSide('jarLabel'); }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="size-3" /> GEN
                        </button>
                      </div>
                    )}

                    {isGenerating.jarLabel && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-black/60 backdrop-blur-md rounded-lg px-4 py-2.5 border border-white/5 flex items-center gap-2">
                          <Loader2 className="animate-spin text-cyan-400 size-4" />
                          <span className="text-xs text-slate-300">Generating...</span>
                        </div>
                      </div>
                    )}

                    {generatedImages.jarLabel && !isGenerating.jarLabel && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]">
                        <div className="bg-black/50 backdrop-blur-md rounded-full p-3 border border-white/10">
                          <ZoomIn className="size-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lid Label - takes 1/3 */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-mono">{SIDE_LABELS.lidLabel}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => regenerateSide('lidLabel')}
                        disabled={isGenerating.lidLabel}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                        title="Quick Regenerate"
                      >
                        <RefreshCw className={`size-3 ${isGenerating.lidLabel ? 'animate-spin' : ''}`} /> Regen
                      </button>
                      <button
                        onClick={() => setEditingSide('lidLabel')}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                      >
                        <Edit className="size-3" /> Edit Prompt
                      </button>
                    </div>
                  </div>
                  <div
                    className="aspect-square w-full rounded-xl bg-slate-800/50 border border-slate-600/50 relative overflow-hidden group hover:border-violet-400/50 transition-all cursor-pointer shadow-lg hover:shadow-violet-500/10"
                    onClick={() => handleImageClick('lidLabel', SIDE_LABELS.lidLabel)}
                  >
                    {generatedImages.lidLabel ? (
                      <img src={generatedImages.lidLabel} alt="Lid Label" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <Layers className="text-slate-600 size-10 group-hover:text-violet-400 transition-colors" />
                        <button
                          onClick={(e) => { e.stopPropagation(); regenerateSide('lidLabel'); }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="size-3" /> GEN
                        </button>
                      </div>
                    )}

                    {isGenerating.lidLabel && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-black/60 backdrop-blur-md rounded-lg px-4 py-2.5 border border-white/5 flex items-center gap-2">
                          <Loader2 className="animate-spin text-cyan-400 size-4" />
                          <span className="text-xs text-slate-300">Generating...</span>
                        </div>
                      </div>
                    )}

                    {generatedImages.lidLabel && !isGenerating.lidLabel && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]">
                        <div className="bg-black/50 backdrop-blur-md rounded-full p-3 border border-white/10">
                          <ZoomIn className="size-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Jar Label Text Only (No Character) */}
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-mono">{SIDE_LABELS.jarLabelNoChar}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => regenerateSide('jarLabelNoChar')}
                      disabled={isGenerating.jarLabelNoChar}
                      className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                      title="Quick Regenerate"
                    >
                      <RefreshCw className={`size-3 ${isGenerating.jarLabelNoChar ? 'animate-spin' : ''}`} /> Regen
                    </button>
                    <button
                      onClick={() => setEditingSide('jarLabelNoChar')}
                      className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/5"
                    >
                      <Edit className="size-3" /> Edit Prompt
                    </button>
                  </div>
                </div>
                <div
                  className="aspect-video w-full rounded-xl bg-slate-800/50 border border-slate-600/50 relative overflow-hidden group hover:border-amber-400/50 transition-all cursor-pointer shadow-lg hover:shadow-amber-500/10"
                  onClick={() => handleImageClick('jarLabelNoChar', SIDE_LABELS.jarLabelNoChar)}
                >
                  {generatedImages.jarLabelNoChar ? (
                    <img src={generatedImages.jarLabelNoChar} alt="Jar Label Text Only" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <Layers className="text-slate-600 size-10 group-hover:text-amber-400 transition-colors" />
                      <button
                        onClick={(e) => { e.stopPropagation(); regenerateSide('jarLabelNoChar'); }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <RefreshCw className="size-3" /> GEN
                      </button>
                    </div>
                  )}

                  {isGenerating.jarLabelNoChar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                      <div className="bg-black/60 backdrop-blur-md rounded-lg px-4 py-2.5 border border-white/5 flex items-center gap-2">
                        <Loader2 className="animate-spin text-cyan-400 size-4" />
                        <span className="text-xs text-slate-300">Generating...</span>
                      </div>
                    </div>
                  )}

                  {generatedImages.jarLabelNoChar && !isGenerating.jarLabelNoChar && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]">
                      <div className="bg-black/50 backdrop-blur-md rounded-full p-3 border border-white/10">
                        <ZoomIn className="size-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            image={lightbox.image}
            label={lightbox.label}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence >

      {/* Prompt Editor Modal */}
      <AnimatePresence>
        {editingSide && (
          <PromptEditorModal
            side={editingSide}
            label={SIDE_LABELS[editingSide]}
            template={templates[editingSide]}
            onClose={() => setEditingSide(null)}
            onSave={updateTemplate}
            onRegen={regenerateSide}
            isGenerating={isGenerating[editingSide]}
          />
        )}
      </AnimatePresence>
    </>
  );
}
