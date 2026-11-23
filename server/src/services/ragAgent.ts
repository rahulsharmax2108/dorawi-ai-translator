import { geminiService } from './gemini.js';
import { vectorStore } from './vectorStore.js';
import { Citation, RAGMessage, SearchResult } from '../types.js';

export interface RAGAnswerResult {
  answer: string;
  citations: Citation[];
  queryIntent: string;
  retrievedCount: number;
}

export class RAGAgent {
  /**
   * Processes a query using an agentic RAG workflow:
   * 1. Query intent detection
   * 2. Semantic vector retrieval with hybrid lexical boost
   * 3. Citation extraction
   * 4. Grounded synthesis using Gemini
   */
  public async answerQuestion(
    question: string,
    chatHistory: RAGMessage[] = [],
    documentIdFilter?: string,
    apiKeyOverride?: string
  ): Promise<RAGAnswerResult> {
    const { citations, contextPrompt, queryIntent, searchResults } = await this.prepareContext(
      question,
      documentIdFilter,
      apiKeyOverride
    );

    const systemPrompt = `You are DoraWi, an intelligent AI Assistant with access to the user's private documents via high-precision vector retrieval.
Your core instructions:
1. Provide accurate, context-grounded answers based strictly on the provided DOCUMENT EXCERPTS below.
2. Whenever citing information, clearly reference the source document and chunk index (e.g. "[Excerpt 1: filename.pdf]").
3. Maintain an articulate, helpful, professional tone. Use Markdown formatting (bolding, lists, code blocks, tables) for clarity.
4. If the retrieved documents do not contain sufficient evidence to answer the question, explicitly acknowledge this rather than hallucinating facts.
5. If the user asks a meta question or greeting, respond politely while highlighting what documents are available in context.`;

    const fullPrompt = `${contextPrompt}

USER CONVERSATION HISTORY:
${chatHistory.slice(-4).map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

CURRENT USER QUESTION:
${question}

RESPONSE:`;

    const answer = await geminiService.generateText(fullPrompt, systemPrompt, apiKeyOverride, 0.2);

    return {
      answer,
      citations,
      queryIntent,
      retrievedCount: searchResults.length,
    };
  }

  /**
   * Streams the answer using Server-Sent Events (SSE) compatible async generator.
   */
  public async *streamAnswer(
    question: string,
    chatHistory: RAGMessage[] = [],
    documentIdFilter?: string,
    apiKeyOverride?: string
  ): AsyncGenerator<{ type: 'meta' | 'token' | 'done'; data: any }, void, unknown> {
    const { citations, contextPrompt, queryIntent, searchResults } = await this.prepareContext(
      question,
      documentIdFilter,
      apiKeyOverride
    );

    // Yield metadata first so the client can immediately display citations
    yield {
      type: 'meta',
      data: {
        citations,
        queryIntent,
        retrievedCount: searchResults.length,
      },
    };

    const systemPrompt = `You are DoraWi, an intelligent AI Assistant with access to the user's private documents via high-precision vector retrieval.
Your core instructions:
1. Provide accurate, context-grounded answers based strictly on the provided DOCUMENT EXCERPTS below.
2. Whenever citing information, clearly reference the source document and chunk index (e.g. "[Excerpt 1: filename.pdf]").
3. Maintain an articulate, helpful, professional tone. Use Markdown formatting for clarity.
4. If the retrieved documents do not contain sufficient evidence, state it clearly.`;

    const fullPrompt = `${contextPrompt}

USER CONVERSATION HISTORY:
${chatHistory.slice(-4).map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

CURRENT USER QUESTION:
${question}

RESPONSE:`;

    const stream = geminiService.streamGenerateText(fullPrompt, systemPrompt, apiKeyOverride, 0.2);

    for await (const token of stream) {
      yield {
        type: 'token',
        data: token,
      };
    }

    yield {
      type: 'done',
      data: { citations },
    };
  }

  /**
   * Generates a rapid structured executive summary of a document.
   */
  public async summarizeDocument(
    documentId: string,
    apiKeyOverride?: string
  ): Promise<{ summary: string; keyTakeaways: string[] }> {
    const chunks = vectorStore.getChunks(documentId);
    if (chunks.length === 0) {
      return { summary: 'No document chunks found.', keyTakeaways: [] };
    }

    const docName = chunks[0].documentName;
    const sampleContent = chunks.slice(0, 8).map((c) => c.content).join('\n\n---\n\n');

    const prompt = `Analyze the following document excerpts from "${docName}" and provide:
1. A concise 2-3 paragraph Executive Summary.
2. 4-6 Key Actionable Takeaways or Insights.

DOCUMENT EXCERPTS:
${sampleContent}

Please format the response in clean Markdown.`;

    const result = await geminiService.generateText(
      prompt,
      'You are DoraWi Document Analyzer. Be concise, insightful, and structured.',
      apiKeyOverride,
      0.3
    );

    return {
      summary: result,
      keyTakeaways: [],
    };
  }

  private async prepareContext(
    question: string,
    documentIdFilter?: string,
    apiKeyOverride?: string
  ): Promise<{
    citations: Citation[];
    contextPrompt: string;
    queryIntent: string;
    searchResults: SearchResult[];
  }> {
    // 1. Generate dense vector for question
    const queryVector = await geminiService.getEmbedding(question, apiKeyOverride);

    // 2. Perform hybrid vector search
    const searchResults = vectorStore.similaritySearch(
      queryVector,
      question,
      6,
      documentIdFilter,
      0.15
    );

    // 3. Extract citations
    const citations: Citation[] = searchResults.map((res, idx) => ({
      chunkId: res.chunk.id,
      documentId: res.chunk.documentId,
      documentName: res.chunk.documentName,
      chunkIndex: res.chunk.chunkIndex,
      excerpt: res.chunk.content.slice(0, 280) + (res.chunk.content.length > 280 ? '...' : ''),
      similarity: Number(res.similarity.toFixed(3)),
    }));

    // 4. Determine intent
    let queryIntent = 'Fact Retrieval';
    const qLower = question.toLowerCase();
    if (qLower.includes('summar') || qLower.includes('overview') || qLower.includes('outline')) {
      queryIntent = 'Executive Synthesis';
    } else if (qLower.includes('compare') || qLower.includes('difference') || qLower.includes('vs')) {
      queryIntent = 'Comparative Analysis';
    } else if (qLower.includes('how') || qLower.includes('step') || qLower.includes('guide')) {
      queryIntent = 'Procedural Guidance';
    }

    // 5. Build context prompt
    let contextPrompt = '';
    if (searchResults.length === 0) {
      contextPrompt = 'NO RELEVANT DOCUMENTS FOUND IN VECTOR STORE.';
    } else {
      contextPrompt = 'RELEVANT DOCUMENT EXCERPTS RETRIEVED FROM VECTOR STORE:\n\n' +
        searchResults
          .map(
            (res, idx) =>
              `--- EXCERPT ${idx + 1} [Document: ${res.chunk.documentName} | Chunk #${res.chunk.chunkIndex} | Relevance: ${(res.similarity * 100).toFixed(1)}%] ---\n${res.chunk.content}`
          )
          .join('\n\n');
    }

    return { citations, contextPrompt, queryIntent, searchResults };
  }
}

export const ragAgent = new RAGAgent();
