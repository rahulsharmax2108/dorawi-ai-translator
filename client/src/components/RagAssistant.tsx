import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Layers,
  FileText,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { Citation, DocumentMetadata, RAGMessage } from '../types';
import { api } from '../services/api';

interface RagAssistantProps {
  documents: DocumentMetadata[];
  selectedDocId?: string;
  onSelectDocId: (id?: string) => void;
}

export const RagAssistant: React.FC<RagAssistantProps> = ({
  documents,
  selectedDocId,
  onSelectDocId,
}) => {
  const [messages, setMessages] = useState<RAGMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Welcome to **DoraWi RAG Assistant**! Ask any question about your indexed documents. I retrieve relevant semantic passages via dense vector embeddings and synthesize accurate, grounded answers with citations.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Selected document info
  const selectedDoc = documents.find((d) => d.id === selectedDocId);
  const isCustomDoc = selectedDoc && !selectedDoc.name.toLowerCase().includes('dorawi');

  // Context-aware prompt suggestions
  const promptSuggestions = isCustomDoc
    ? [
        `Summarize the key points in ${selectedDoc.name.replace(/\.[^/.]+$/, '')}`,
        `What are the most critical takeaways from this document?`,
        `What are the main requirements and standards discussed?`,
        `Extract the key actionable guidelines and recommendations`,
      ]
    : [
        'Summarize the core architecture of DoraWi',
        'How does the agentic contextual translation pipeline work?',
        'What vector embedding model and dimensionality is used?',
        'Explain the hybrid retrieval and lexical scoring mechanism',
      ];

  const handleSend = async (overridePrompt?: string) => {
    const question = overridePrompt || inputQuestion;
    if (!question.trim() || isStreaming) return;

    const userMessage: RAGMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantId = `assistant_${Date.now()}`;
    const placeholderAssistant: RAGMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, placeholderAssistant]);
    setInputQuestion('');
    setIsStreaming(true);

    const historyForBackend = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    let accumulatedContent = '';

    await api.streamChat(
      question,
      historyForBackend,
      selectedDocId,
      (meta) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  citations: meta.citations,
                  queryIntent: meta.queryIntent,
                }
              : msg
          )
        );
      },
      (token) => {
        accumulatedContent += token;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: accumulatedContent,
                }
              : msg
          )
        );
      },
      () => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  isStreaming: false,
                }
              : msg
          )
        );
      },
      (error) => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: `⚠️ Error: ${error}`,
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    );
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        content: 'Chat cleared. Ask anything from your knowledge base!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        {/* Document Filter Panel */}
        <div className="neu-flat p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Scope
            </span>
            {selectedDocId && (
              <button
                onClick={() => onSelectDocId(undefined)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                Reset
              </button>
            )}
          </div>

          <select
            value={selectedDocId || ''}
            onChange={(e) => onSelectDocId(e.target.value || undefined)}
            className="neu-input w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
          >
            <option value="">All Documents (Vector Index)</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.chunkCount} chunks)
              </option>
            ))}
          </select>

          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Retrieval across {documents.reduce((acc, d) => acc + d.chunkCount, 0)} dense 768-d vector chunks using cosine similarity.
          </p>
        </div>

        {/* Active Citation Card Inspector */}
        {activeCitation ? (
          <div className="neu-flat p-5 rounded-3xl space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Source Citation</span>
              </span>
              <button
                onClick={() => setActiveCitation(null)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="text-xs font-bold text-slate-800 truncate">
              {activeCitation.documentName}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span>Chunk #{activeCitation.chunkIndex}</span>
              <span className="font-bold text-emerald-600">
                {(activeCitation.similarity * 100).toFixed(1)}% Match
              </span>
            </div>
            <p className="text-xs text-slate-700 font-mono neu-pressed p-3 rounded-xl max-h-48 overflow-y-auto leading-relaxed">
              "{activeCitation.excerpt}"
            </p>
          </div>
        ) : (
          <div className="hidden lg:block neu-pressed p-5 rounded-3xl text-center text-xs text-slate-500 leading-relaxed font-medium">
            Click any citation pill in the chat to view the source passage & relevance score.
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-3 neu-flat rounded-3xl flex flex-col h-[75vh] overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-white/60 bg-[#eef2f7]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl neu-pressed flex items-center justify-center text-indigo-600">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">
                {selectedDoc ? `RAG: ${selectedDoc.name}` : 'RAG Assistant'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {selectedDoc ? `Grounded in ${selectedDoc.chunkCount} indexed vector chunks` : 'Context-grounded document answers with source attribution'}
              </p>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5"
            title="Clear conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-2xl neu-flat flex-shrink-0 flex items-center justify-center text-indigo-600 border border-white">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`p-5 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'neu-btn-primary rounded-br-none text-white'
                    : 'neu-flat-sm text-slate-800 rounded-bl-none'
                }`}
              >
                {/* Intent Badge */}
                {msg.queryIntent && (
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold neu-pressed text-indigo-700 mb-2.5">
                    Intent: {msg.queryIntent}
                  </div>
                )}

                {/* Render Rich Markdown with Clean Typography */}
                <div className="font-sans">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        h3: ({ node, ...props }) => (
                          <h3 className="text-sm font-extrabold text-slate-900 mt-2 mb-2 pb-1 border-b border-slate-200/80" {...props} />
                        ),
                        h4: ({ node, ...props }) => (
                          <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide mt-3 mb-1.5" {...props} />
                        ),
                        p: ({ node, ...props }) => <p className="mb-2 leading-relaxed text-slate-700" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-outside space-y-1.5 my-2.5 pl-4 text-slate-700" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-outside space-y-1.5 my-2.5 pl-4 text-slate-700" {...props} />,
                        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                        em: ({ node, ...props }) => <em className="text-slate-500 italic" {...props} />,
                        code: ({ node, ...props }) => (
                          <code className="neu-pill px-1.5 py-0.5 rounded text-[11px] font-mono text-indigo-700 bg-indigo-50/50" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}

                  {msg.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-indigo-600 animate-pulse rounded" />
                  )}
                </div>

                {/* Citations Preview */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200/70 space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-600" />
                      <span>Retrieved Citations ({msg.citations.length})</span>
                    </span>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.citations.map((cite, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => setActiveCitation(cite)}
                          className="neu-btn px-2.5 py-1 rounded-xl text-[11px] font-medium text-slate-700 hover:text-indigo-600 flex items-center gap-1.5"
                        >
                          <FileText className="w-3 h-3 text-indigo-600" />
                          <span className="truncate max-w-[150px]">{cite.documentName}</span>
                          <span className="font-bold text-emerald-600">#C{cite.chunkIndex}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-2.5 text-right ${
                    msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-2xl neu-flat flex-shrink-0 flex items-center justify-center text-slate-700 border border-white">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Context-Aware Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="px-6 py-2.5 flex flex-wrap gap-2 border-t border-white/60 bg-[#eef2f7]">
            {promptSuggestions.map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSend(prompt)}
                className="neu-btn text-xs px-3.5 py-1.5 rounded-full text-slate-700 hover:text-indigo-600 font-medium flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-5 border-t border-white/60 bg-[#eef2f7]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={
                selectedDoc
                  ? `Ask anything about ${selectedDoc.name}...`
                  : 'Ask anything about the uploaded documents...'
              }
              disabled={isStreaming}
              className="neu-input flex-1 px-5 py-3.5 rounded-2xl text-sm text-slate-800 placeholder-slate-400 font-medium"
            />

            <button
              type="submit"
              disabled={isStreaming || !inputQuestion.trim()}
              className="neu-btn-primary p-3.5 rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
