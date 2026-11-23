import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Layers,
  Bot,
  Languages,
  FileCode,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';
import { ChunkInfo, DocumentMetadata } from '../types';
import { api } from '../services/api';

interface DocumentManagerProps {
  documents: DocumentMetadata[];
  onRefresh: () => void;
  onSelectForChat: (docId: string) => void;
  onSelectForTranslate: (docId: string) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  onRefresh,
  onSelectForChat,
  onSelectForTranslate,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeChunkModal, setActiveChunkModal] = useState<{
    docName: string;
    chunks: ChunkInfo[];
  } | null>(null);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const fileArr = Array.from(files);
      await api.uploadDocuments(fileArr);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to parse and embed files.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the vector store?`)) return;
    try {
      await api.deleteDocument(id);
      onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Could not delete document');
    }
  };

  const handleInspectChunks = async (doc: DocumentMetadata) => {
    setLoadingChunks(true);
    try {
      const chunks = await api.getDocumentChunks(doc.id);
      setActiveChunkModal({ docName: doc.name, chunks });
    } catch (err: any) {
      alert(err?.message || 'Failed to fetch chunks');
    } finally {
      setLoadingChunks(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header and Summary stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            Knowledge Base & Document Vault
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Upload PDFs, Word documents, and text files. DoraWi chunks and embeds them for semantic search and contextual translation.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="neu-btn self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-slate-700 text-xs font-bold rounded-2xl"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Store</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone (Neumorphic Inset / Sunken Well) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl p-10 text-center transition-all ${
          dragActive
            ? 'neu-pressed border-2 border-indigo-400 scale-[0.99]'
            : 'neu-pressed hover:border-indigo-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,.json,.csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center gap-3.5">
          <div className="w-16 h-16 rounded-2xl neu-flat flex items-center justify-center text-indigo-600 border border-white">
            {isUploading ? (
              <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              {isUploading ? 'Parsing & generating 768-d vector embeddings...' : 'Click or drag files here to index'}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Supports <span className="text-indigo-600 font-bold">PDF, DOCX, TXT, Markdown</span> (Max 25MB)
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl neu-flat text-rose-700 text-xs flex items-center justify-between border-l-4 border-rose-500">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Documents Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
          Indexed Documents ({documents.length})
        </h3>

        {documents.length === 0 ? (
          <div className="text-center py-12 rounded-3xl neu-pressed text-slate-500 text-sm font-medium">
            No documents indexed yet. Upload a PDF or DOCX file to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="neu-flat p-6 rounded-3xl flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-3 rounded-2xl neu-pressed flex-shrink-0">
                        {doc.originalName.endsWith('.pdf') ? (
                          <FileText className="w-6 h-6 text-rose-500" />
                        ) : doc.originalName.endsWith('.docx') ? (
                          <FileText className="w-6 h-6 text-blue-500" />
                        ) : (
                          <FileCode className="w-6 h-6 text-emerald-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition">
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-1 font-medium">
                          <span>{formatBytes(doc.size)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-bold text-indigo-600">
                            <Layers className="w-3.5 h-3.5" />
                            {doc.chunkCount} vector chunks
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(doc.id, doc.name)}
                      className="neu-btn p-2 rounded-xl text-slate-500 hover:text-rose-600"
                      title="Delete from Vector Store"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {doc.summary && (
                    <p className="text-xs text-slate-600 mt-3.5 line-clamp-2 neu-pressed p-3 rounded-2xl leading-relaxed">
                      {doc.summary}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-5 mt-5 border-t border-slate-200/60">
                  <button
                    onClick={() => handleInspectChunks(doc)}
                    disabled={loadingChunks}
                    className="neu-btn flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-xl"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Chunks</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectForChat(doc.id)}
                      className="neu-btn flex items-center gap-1.5 text-xs font-bold text-indigo-700 px-3.5 py-1.5 rounded-xl"
                    >
                      <Bot className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Chat</span>
                    </button>

                    <button
                      onClick={() => onSelectForTranslate(doc.id)}
                      className="neu-btn flex items-center gap-1.5 text-xs font-bold text-purple-700 px-3.5 py-1.5 rounded-xl"
                    >
                      <Languages className="w-3.5 h-3.5 text-purple-600" />
                      <span>Translate</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspect Chunks Modal */}
      {activeChunkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[85vh] neu-flat rounded-3xl flex flex-col shadow-2xl p-6 text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>Vector Chunks: {activeChunkModal.docName}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Total {activeChunkModal.chunks.length} chunks generated using semantic boundary preservation.
                </p>
              </div>

              <button
                onClick={() => setActiveChunkModal(null)}
                className="neu-btn p-2 rounded-xl text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-3.5 flex-1 pr-1">
              {activeChunkModal.chunks.map((chunk) => (
                <div
                  key={chunk.id}
                  className="p-4 rounded-2xl neu-pressed text-xs font-mono text-slate-700"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-2 mb-2 font-sans font-bold">
                    <span className="text-indigo-700">Chunk #{chunk.chunkIndex}</span>
                    <span className="flex items-center gap-2">
                      <span>{chunk.charCount} characters</span>
                      <span className="neu-pill px-2.5 py-0.5 rounded-full text-emerald-700 font-bold bg-emerald-50">
                        Embedded (768-d)
                      </span>
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{chunk.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
