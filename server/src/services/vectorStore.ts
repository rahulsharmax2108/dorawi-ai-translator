import { DocumentChunk, DocumentMetadata, SearchResult } from '../types.js';

export class VectorStore {
  private documents: Map<string, DocumentMetadata> = new Map();
  private chunks: Map<string, DocumentChunk> = new Map();

  constructor() {
    this.seedSampleDocument();
  }

  /**
   * Calculates cosine similarity between two numerical vectors.
   */
  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    const len = Math.min(vecA.length, vecB.length);

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Adds or updates a document along with its embedded chunks.
   */
  public addDocument(metadata: DocumentMetadata, chunks: DocumentChunk[]): void {
    metadata.chunkCount = chunks.length;
    this.documents.set(metadata.id, metadata);

    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);
    }
  }

  /**
   * Deletes a document and all corresponding chunks.
   */
  public deleteDocument(documentId: string): boolean {
    if (!this.documents.has(documentId)) {
      return false;
    }

    this.documents.delete(documentId);
    for (const [chunkId, chunk] of this.chunks.entries()) {
      if (chunk.documentId === documentId) {
        this.chunks.delete(chunkId);
      }
    }
    return true;
  }

  /**
   * Lists all uploaded documents.
   */
  public getDocuments(): DocumentMetadata[] {
    return Array.from(this.documents.values()).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  public getDocument(id: string): DocumentMetadata | undefined {
    return this.documents.get(id);
  }

  public getChunks(documentId?: string): DocumentChunk[] {
    const all = Array.from(this.chunks.values());
    if (!documentId) return all;
    return all.filter((c) => c.documentId === documentId);
  }

  /**
   * Performs semantic vector search with optional document filter and fallback lexical score.
   */
  public similaritySearch(
    queryVector: number[],
    queryText: string,
    topK = 5,
    documentIdFilter?: string,
    minSimilarity = 0.15
  ): SearchResult[] {
    const candidates = Array.from(this.chunks.values()).filter(
      (chunk) => !documentIdFilter || chunk.documentId === documentIdFilter
    );

    const queryWords = queryText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const scored: SearchResult[] = candidates.map((chunk) => {
      let vectorScore = 0;
      if (chunk.embedding && chunk.embedding.length > 0 && queryVector.length > 0) {
        vectorScore = this.cosineSimilarity(queryVector, chunk.embedding);
      }

      // Keyword lexical boost (BM25-style simple term frequency)
      const chunkLower = chunk.content.toLowerCase();
      let keywordMatches = 0;
      for (const word of queryWords) {
        if (chunkLower.includes(word)) {
          keywordMatches++;
        }
      }
      const lexicalScore = queryWords.length > 0 ? (keywordMatches / queryWords.length) * 0.4 : 0;

      // Hybrid score combining dense vector embedding & lexical matching
      const combinedScore = Math.max(vectorScore, 0) * 0.75 + lexicalScore * 0.25;

      return {
        chunk,
        similarity: combinedScore,
      };
    });

    return scored
      .filter((res) => res.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Pre-seeds an initial sample document so users have immediate context to play with.
   */
  private seedSampleDocument(): void {
    const sampleId = 'sample-dorawi-architecture';
    const sampleText = `DoraWi AI Translator & RAG Assistant Architecture Overview

1. Executive Summary
DoraWi is an enterprise-grade AI Translator and Retrieval-Augmented Generation (RAG) platform designed to eliminate language barriers while delivering low-latency, context-grounded intelligence over private documents.

2. RAG Engine & Vector Pipeline
The core RAG engine decomposes documents into semantic chunks preserving heading hierarchy and tabular structures. Chunks are converted into 768-dimensional dense vectors using Google Gemini's text-embedding-004 model. When a user asks a question, DoraWi performs hybrid retrieval (dense semantic vectors combined with lexical keyword matching), ranks relevant passages, and synthesizes answers with exact chunk citations.

3. Contextual Multilingual Translation
Unlike traditional machine translation that treats sentences in isolation, DoraWi's agentic workflow utilizes a three-phase approach:
- Domain & Terminology Discovery: Automatically generates a glossary of technical, legal, or industry-specific terms.
- Context-Aware Segment Translation: Translates text blocks while preserving prior conversational context and tone.
- Post-Translation Refinement: Enforces terminology consistency and maintains code blocks, markdown tables, and formatting tags.

4. Performance & Scalability
DoraWi achieves sub-second retrieval latency via optimized in-memory vector index indexing, with seamless export paths to distributed vector stores such as Pinecone, LanceDB, or pgvector.`;

    const paragraphs = sampleText.split('\n\n');
    const chunks: DocumentChunk[] = paragraphs.map((para, i) => ({
      id: `${sampleId}_chunk_${i}`,
      documentId: sampleId,
      documentName: 'DoraWi_Architecture_Overview.txt',
      chunkIndex: i,
      content: para.trim(),
      charCount: para.length,
      embedding: [],
    }));

    const metadata: DocumentMetadata = {
      id: sampleId,
      name: 'DoraWi_Architecture_Overview.txt',
      originalName: 'DoraWi_Architecture_Overview.txt',
      mimeType: 'text/plain',
      size: Buffer.byteLength(sampleText, 'utf8'),
      uploadedAt: new Date().toISOString(),
      chunkCount: chunks.length,
      charCount: sampleText.length,
      summary: 'Architectural overview of DoraWi AI Translator and RAG Assistant with Gemini LLM integration.',
    };

    this.addDocument(metadata, chunks);
  }
}

export const vectorStore = new VectorStore();
