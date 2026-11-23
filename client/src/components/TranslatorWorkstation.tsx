import React, { useState, useEffect } from 'react';
import {
  Languages,
  Copy,
  Check,
  Download,
  BookMarked,
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { DocumentMetadata, Language, TranslationResult, DEFAULT_LANGUAGES } from '../types';
import { api } from '../services/api';

interface TranslatorWorkstationProps {
  documents: DocumentMetadata[];
  selectedDocId?: string;
}

export const TranslatorWorkstation: React.FC<TranslatorWorkstationProps> = ({
  documents,
  selectedDocId,
}) => {
  const [sourceText, setSourceText] = useState(
    `DoraWi is a full-stack AI Translation and RAG platform powered by Google Gemini and vector embeddings. It parses complex documents, extracts domain terminology, and ensures high-fidelity translation while preserving formatting, table layouts, and technical nuances.`
  );
  const [translatedText, setTranslatedText] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [domain, setDomain] = useState<'general' | 'technical' | 'legal' | 'medical' | 'business' | 'creative'>('technical');
  const [tone, setTone] = useState<'professional' | 'casual' | 'academic' | 'concise' | 'fluent'>('professional');
  const [languages, setLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [docPicker, setDocPicker] = useState<string>(selectedDocId || '');

  useEffect(() => {
    api
      .getLanguages()
      .then((data) => {
        if (data && data.length > 0) {
          setLanguages(data);
        }
      })
      .catch((err) => {
        console.warn('Using default language set:', err);
      });
  }, []);

  const handleDocSelect = async (docId: string) => {
    setDocPicker(docId);
    if (!docId) return;
    try {
      const chunks = await api.getDocumentChunks(docId);
      const combined = chunks.map((c) => c.content).join('\n\n');
      setSourceText(combined);
    } catch (e) {
      console.error('Failed to load document text:', e);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim() || isTranslating) return;
    setIsTranslating(true);
    setTranslationResult(null);

    try {
      const result = await api.translate({
        text: sourceText,
        targetLanguage: targetLang,
        domain,
        tone,
      });

      setTranslationResult(result);
      setTranslatedText(result.translatedText);
    } catch (err: any) {
      alert(err?.message || 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTranslation = () => {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dorawi_translated_${targetLang.toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Configuration Toolbar */}
      <div className="neu-flat p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        {/* Document Selector Quick Load */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl neu-pressed text-indigo-600">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">Source:</span>
          <select
            value={docPicker}
            onChange={(e) => handleDocSelect(e.target.value)}
            className="neu-input px-3.5 py-2 rounded-xl text-xs font-medium text-slate-800 cursor-pointer min-w-[150px]"
          >
            <option value="">Custom Text Input</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Translation Settings Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target Language */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Target:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="neu-input px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer min-w-[150px]"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.name}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Domain */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Domain:</span>
            <select
              value={domain}
              onChange={(e: any) => setDomain(e.target.value)}
              className="neu-input px-3 py-2 rounded-xl text-xs font-medium text-slate-800 cursor-pointer capitalize min-w-[150px]"
            >
              <option value="technical">Technical / Engineering</option>
              <option value="legal">Legal & Compliance</option>
              <option value="medical">Medical / Scientific</option>
              <option value="business">Business / Corporate</option>
              <option value="creative">Creative & Marketing</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Tone */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Tone:</span>
            <select
              value={tone}
              onChange={(e: any) => setTone(e.target.value)}
              className="neu-input px-3 py-2 rounded-xl text-xs font-medium text-slate-800 cursor-pointer capitalize min-w-[130px]"
            >
              <option value="professional">Professional</option>
              <option value="academic">Academic</option>
              <option value="fluent">Fluent Natural</option>
              <option value="concise">Concise</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          {/* Translate Action Button */}
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !sourceText.trim()}
            className="neu-btn-primary px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {isTranslating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Translating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Translate Contextually</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dual Pane Translation Studio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Pane */}
        <div className="neu-flat rounded-3xl p-6 flex flex-col h-[580px] space-y-3">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Source Document
              </span>
              <span className="neu-pill px-2.5 py-0.5 rounded-full text-[11px] font-mono text-slate-600">
                {sourceText.length} chars
              </span>
            </div>

            <button
              onClick={() => setSourceText('')}
              className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 neu-pressed rounded-2xl p-4 flex flex-col overflow-hidden">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste or write your source document here..."
              className="flex-1 w-full bg-transparent text-sm leading-relaxed text-slate-800 placeholder-slate-400 resize-none focus:outline-none font-sans"
            />
          </div>
        </div>

        {/* Target Pane */}
        <div className="neu-flat rounded-3xl p-6 flex flex-col h-[580px] space-y-3">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <Languages className="w-4 h-4" />
                <span>{targetLang} Output</span>
              </span>
              {translatedText && (
                <span className="neu-pill px-2.5 py-0.5 rounded-full text-[11px] font-mono text-indigo-700 bg-indigo-50/50">
                  {translatedText.length} chars
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                disabled={!translatedText}
                className="neu-btn p-2 rounded-xl text-slate-600 hover:text-indigo-600 disabled:opacity-40"
                title="Copy Translation"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={downloadTranslation}
                disabled={!translatedText}
                className="neu-btn p-2 rounded-xl text-slate-600 hover:text-indigo-600 disabled:opacity-40"
                title="Download as Markdown"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 neu-pressed rounded-2xl p-5 overflow-y-auto text-sm leading-relaxed text-slate-800 font-sans whitespace-pre-wrap">
            {isTranslating ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-xs font-medium">Extracting domain glossary & translating...</p>
              </div>
            ) : translatedText ? (
              translatedText
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic text-center p-6">
                Translated text will appear here. Formatting, domain terminology, and markdown structures will be preserved.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agentic Terminology & Performance Metrics */}
      {translationResult && (
        <div className="neu-flat p-6 rounded-3xl space-y-4 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-indigo-600" />
              <span>Agentic Terminology Glossary & Metrics</span>
            </h4>

            <div className="flex items-center gap-4 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 neu-pill px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>{translationResult.durationMs}ms latency</span>
              </span>
              <span className="flex items-center gap-1.5 neu-pill px-3 py-1 rounded-full">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>{translationResult.chunkCount} chunks processed</span>
              </span>
            </div>
          </div>

          {translationResult.glossaryUsed.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {translationResult.glossaryUsed.map((term, tIdx) => (
                <div key={tIdx} className="neu-pressed p-3.5 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span>{term.sourceTerm}</span>
                    <ArrowRight className="w-3 h-3 text-indigo-600" />
                    <span className="text-indigo-600">{term.targetTerm}</span>
                  </div>
                  {term.definition && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {term.definition}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-medium">
              Direct contextual translation applied with sentence flow retention.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
