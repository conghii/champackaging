import React from 'react';
import { Box, Bell, User, Menu, Wand2 } from 'lucide-react';

export function Header({ onToggleSidebar, onTogglePromptCenter }: {
  onToggleSidebar?: () => void,
  onTogglePromptCenter?: () => void
}) {
  return (
    <header className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 bg-slate-900/60 backdrop-blur-md border-b border-white/10 z-50 shrink-0">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="size-5" />
          </button>
        )}
        <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
          <Box className="text-white size-5" />
        </div>
        <h1 className="text-white text-base sm:text-lg font-bold tracking-tight">Packaging AI Studio</h1>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <nav className="hidden md:flex items-center gap-6">
          <a className="text-sm font-medium text-white hover:text-cyan-400 transition-colors" href="#">Dashboard</a>
          <a className="text-sm font-medium text-slate-400 hover:text-white transition-colors" href="#">Templates</a>
          <a className="text-sm font-medium text-slate-400 hover:text-white transition-colors" href="#">Brand Assets</a>
        </nav>
        <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors relative">
            <Bell className="text-slate-400 size-4" />
            <span className="absolute top-0 right-0 size-2 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></span>
          </div>
          <div className="size-8 rounded-full bg-slate-700 border border-white/10 ring-2 ring-indigo-500/20 overflow-hidden">
            <User className="text-slate-400 size-full p-1" />
          </div>
        </div>
      </div>
    </header>
  );
}
