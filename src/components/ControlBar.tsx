import React from 'react';
import { Sparkles, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function ControlBar() {
  const { progress, generateAll, generatedImages, isGenerating } = useApp();

  const handleExport = async () => {
    const zip = new JSZip();
    const folder = zip.folder("packaging-assets");
    
    if (!folder) return;

    // Helper to fetch base64 and add to zip
    const addImageToZip = (dataUrl: string | null, filename: string) => {
      if (dataUrl) {
        const base64Data = dataUrl.split(',')[1];
        folder.file(filename, base64Data, { base64: true });
      }
    };

    addImageToZip(generatedImages.topLid, "top-lid.png");
    addImageToZip(generatedImages.side1, "side-1-front.png");
    addImageToZip(generatedImages.side2, "side-2-collection.png");
    addImageToZip(generatedImages.side3, "side-3-features.png");
    addImageToZip(generatedImages.side4, "side-4-legal.png");
    addImageToZip(generatedImages.marketing, "marketing-mockup.png");

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "packaging-design-kit.zip");
  };

  const isAnyGenerating = Object.values(isGenerating).some(Boolean);
  const hasImages = Object.values(generatedImages).some(Boolean);

  return (
    <footer className="h-20 bg-slate-900/80 backdrop-blur-md border-t border-white/10 px-6 flex items-center justify-between shrink-0 relative z-50">
      {/* Progress Info */}
      <div className="flex flex-col gap-1 w-64">
        <div className="flex items-center justify-between text-xs">
          <span className={`font-medium ${isAnyGenerating ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`}>
            {isAnyGenerating ? 'Generating Assets...' : 'Ready'}
          </span>
          <span className="text-slate-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] relative transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            {isAnyGenerating && (
              <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
            )}
          </div>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <button 
          onClick={generateAll}
          disabled={isAnyGenerating}
          className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-200"></div>
          <div className="relative flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full leading-none text-white shadow-lg border border-white/20 hover:scale-105 transition-transform duration-200">
            <Sparkles className="size-5" />
            <span className="font-bold tracking-wide">GEN ALL</span>
          </div>
        </button>
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-white/5 text-xs text-slate-400">
          <span className="size-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
          Server Online
        </div>
        
        <div className="relative group">
          <button 
            onClick={handleExport}
            disabled={!hasImages}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Export</span>
            <ChevronUp className="size-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
