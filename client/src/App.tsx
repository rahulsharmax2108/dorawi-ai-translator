import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RagAssistant } from './components/RagAssistant';
import { TranslatorWorkstation } from './components/TranslatorWorkstation';
import { DocumentManager } from './components/DocumentManager';
import { ApiKeyModal } from './components/ApiKeyModal';
import { DocumentMetadata, SystemHealth } from './types';
import { api } from './services/api';
import { Database, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rag' | 'translate' | 'documents'>('translate');
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(undefined);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const fetchHealthAndDocs = async () => {
    try {
      const [h, docs] = await Promise.all([api.getHealth(), api.getDocuments()]);
      setHealth(h);
      setDocuments(docs);
    } catch (err) {
      console.error('Initial fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchHealthAndDocs();
  }, []);

  const handleSelectForChat = (docId: string) => {
    setSelectedDocId(docId);
    setActiveTab('rag');
  };

  const handleSelectForTranslate = (docId: string) => {
    setSelectedDocId(docId);
    setActiveTab('translate');
  };

  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Tab Views */}
        {activeTab === 'rag' && (
          <RagAssistant
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDocId={setSelectedDocId}
          />
        )}

        {activeTab === 'translate' && (
          <TranslatorWorkstation
            documents={documents}
            selectedDocId={selectedDocId}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentManager
            documents={documents}
            onRefresh={fetchHealthAndDocs}
            onSelectForChat={handleSelectForChat}
            onSelectForTranslate={handleSelectForTranslate}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/60 bg-[#eef2f7] py-6 text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-slate-700">DoraWi</span>
            <span>•</span>
            <span>Google Gemini 2.0 Flash</span>
            <span>•</span>
            <span>text-embedding-004</span>
            <span>•</span>
            <span>React.js & Node.js</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-600 font-bold">
            <span className="neu-pill px-3 py-1 rounded-full flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>In-Memory Vector Store</span>
            </span>
            <span className="neu-pill px-3 py-1 rounded-full flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              <span>Agentic RAG Workflows</span>
            </span>
          </div>
        </div>
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={fetchHealthAndDocs}
        isKeyConfigured={health?.geminiConfigured ?? false}
      />
    </div>
  );
};

export default App;
