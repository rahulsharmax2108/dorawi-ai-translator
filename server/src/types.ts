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
  detectedLanguage?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  charCount: number;
  metadata?: {
    page?: number;
    section?: string;
  };
  embedding?: number[];
}

export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number;
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
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  timestamp?: string;
}

export interface TranslationRequest {
  text?: string;
  documentId?: string;
  sourceLanguage?: string;
  targetLanguage: string;
  domain?: 'general' | 'technical' | 'legal' | 'medical' | 'business' | 'creative';
  tone?: 'professional' | 'casual' | 'academic' | 'concise' | 'fluent';
  preserveFormatting?: boolean;
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
