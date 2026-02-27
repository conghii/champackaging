import React, { useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { Canvas } from './components/Canvas'
import { AppProvider } from './context/AppContext'
import { ApiKeyModal } from './components/ApiKeyModal'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden text-slate-200">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <ApiKeyModal />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar (DNA) */}
        <div
          className={`
            fixed lg:relative inset-y-0 left-0 z-40 w-80
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            bg-slate-900 border-r border-white/5
          `}
        >
          <Sidebar />
        </div>

        {/* Overlay for mobile sidebars */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => {
              setSidebarOpen(false);
            }}
          />
        )}

        {/* Main Canvas Area */}
        <main className="flex-1 overflow-y-auto scrollbar-hide bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
          <Canvas />
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
