export interface DocumentMetadata {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  chunkCount: number;
  charCount: number;
  summary?: string;
}

export interface ChunkInfo {
  id: string;
  chunkIndex: number;
  charCount: number;
  preview: string;
  content: string;
  hasEmbedding: boolean;
}

export interface Citation {
  chunkId: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  page?: number;
  excerpt: string;
  similarity: number;
}

export interface RAGMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  timestamp: string;
  queryIntent?: string;
  isStreaming?: boolean;
}

export interface TranslationGlossaryTerm {
  sourceTerm: string;
  targetTerm: string;
  definition?: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  glossaryUsed: TranslationGlossaryTerm[];
  durationMs: number;
  chunkCount: number;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const DEFAULT_LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export interface SystemHealth {
  status: string;
  appName: string;
  version: string;
  geminiConfigured: boolean;
  stats: {
    documentCount: number;
    chunkCount: number;
  };
}
