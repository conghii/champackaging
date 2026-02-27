import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, ArrowRight, X } from 'lucide-react';

export function ApiKeyModal() {
    const { apiKey, setApiKey, isApiKeyModalOpen, setIsApiKeyModalOpen } = useApp();
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    // Only show when the modal is open
    if (!isApiKeyModalOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) {
            setError('Please enter an API key');
            return;
        }

        // Simple validation (can be more specific depending on the key format)
        if (inputValue.length < 20) {
            setError('API key seems too short. Please check again.');
            return;
        }

        setApiKey(inputValue.trim());
        setIsApiKeyModalOpen(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-indigo-500/10 max-w-md w-full p-8 overflow-hidden relative">
                {/* Close button - only show if there's already a valid key */}
                {apiKey && (
                    <button
                        onClick={() => setIsApiKeyModalOpen(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors z-20"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 p-8 blur-3xl opacity-20 pointer-events-none">
                    <div className="w-32 h-32 bg-indigo-500 rounded-full"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                        <KeyRound className="text-white relative z-10" size={32} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to Packaging AI</h2>
                    <p className="text-slate-400 mb-8 max-w-[280px]">
                        Please enter your Google Gemini API key to start generating packaging designs.
                    </p>

                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                        <div className="flex flex-col gap-1 text-left">
                            <label htmlFor="apiKey" className="text-sm font-medium text-slate-300 ml-1">
                                Gemini API Key
                            </label>
                            <input
                                id="apiKey"
                                type="password"
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setError('');
                                }}
                                className={`w-full bg-slate-950 border ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all`}
                                placeholder={apiKey ? "Nhập API key mới..." : "AIzaSy..."}
                                autoComplete="off"
                            />
                            {error && (
                                <p className="text-red-400 text-sm mt-1 ml-1">{error}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 group"
                        >
                            {apiKey ? "Cập nhật API Key" : "Lưu API Key"}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <p className="text-xs text-slate-500 mt-6 mt-8">
                        Your API key is stored securely in your browser's local storage and is never sent anywhere except directly to Google's API.
                    </p>
                </div>
            </div>
        </div>
    );
}
