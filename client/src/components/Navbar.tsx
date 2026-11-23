import React from 'react';
import { Bot, Languages, Files, Settings, CheckCircle2 } from 'lucide-react';
import { SystemHealth } from '../types';

interface NavbarProps {
  activeTab: 'rag' | 'translate' | 'documents';
  setActiveTab: (tab: 'rag' | 'translate' | 'documents') => void;
  health: SystemHealth | null;
  onOpenKeyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  health,
  onOpenKeyModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#eef2f7]/95 backdrop-blur-md border-b border-white/80 shadow-[0_4px_16px_rgba(209,217,230,0.55)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl neu-flat border border-white select-none">
            <span className="text-base font-black tracking-tight text-indigo-600 font-sans">
              DW
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-slate-800 font-sans">
                Dora<span className="text-indigo-600">Wi</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 neu-pill border border-indigo-100">
                RAG + Gemini 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              AI Document Translator & Contextual Retrieval Engine
            </p>
          </div>
        </div>

        {/* Neumorphic Segmented Tab Switcher */}
        <nav className="flex items-center bg-[#eef2f7] p-1.5 rounded-2xl neu-pressed">
          <button
            onClick={() => setActiveTab('rag')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'rag'
                ? 'neu-tab-active shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff]'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>RAG Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('translate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'translate'
                ? 'neu-tab-active shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff]'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>AI Translator</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'documents'
                ? 'neu-tab-active shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff]'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            <Files className="w-4 h-4" />
            <span>Documents</span>
            {health?.stats?.documentCount ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                {health.stats.documentCount}
              </span>
            ) : null}
          </button>
        </nav>

        {/* Status Pill & Settings */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-xl font-bold neu-pill text-emerald-800 bg-emerald-50/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gemini 2.0 Flash Active</span>
          </div>

          <button
            onClick={onOpenKeyModal}
            title="Configure API & Model"
            className="neu-btn p-2.5 text-slate-700 hover:text-indigo-600 rounded-xl transition flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
