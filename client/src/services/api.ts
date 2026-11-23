import { DocumentMetadata, ChunkInfo, Citation, Language, RAGMessage, SystemHealth, TranslationResult } from '../types';

const API_BASE = '/api';

export class ApiService {
  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const key = localStorage.getItem('dorawi_gemini_api_key');
    const headers: Record<string, string> = { ...customHeaders };
    if (key && key.trim()) {
      headers['x-gemini-api-key'] = key.trim();
    }
    return headers;
  }

  public getSavedApiKey(): string {
    return localStorage.getItem('dorawi_gemini_api_key') || '';
  }

  public setApiKey(key: string): void {
    if (key && key.trim()) {
      localStorage.setItem('dorawi_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('dorawi_gemini_api_key');
    }
  }

  public async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/health`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  }

  public async getDocuments(): Promise<DocumentMetadata[]> {
    const res = await fetch(`${API_BASE}/documents`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    const data = await res.json();
    return data.documents || [];
  }

  public async uploadDocuments(files: File[]): Promise<DocumentMetadata[]> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload documents');
    }

    const data = await res.json();
    return data.documents || [];
  }

  public async getDocumentChunks(id: string): Promise<ChunkInfo[]> {
    const res = await fetch(`${API_BASE}/documents/${id}/chunks`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch chunks');
    const data = await res.json();
    return data.chunks || [];
  }

  public async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete document');
  }

  public async streamChat(
    question: string,
    chatHistory: { role: string; content: string }[],
    documentId: string | undefined,
    onMeta: (meta: { citations: Citation[]; queryIntent: string; retrievedCount: number }) => void,
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: string) => void
  ): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/rag/chat`, {
        method: 'POST',
        headers: this.getHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          question,
          chatHistory,
          documentId: documentId || undefined,
          stream: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No readable stream available');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'meta') {
              onMeta(event.data);
            } else if (event.type === 'token') {
              onToken(event.data);
            } else if (event.type === 'done') {
              onDone();
            } else if (event.type === 'error') {
              onError(event.error);
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e, jsonStr);
          }
        }
      }
      onDone();
    } catch (e: any) {
      onError(e?.message || 'Chat stream failed');
    }
  }

  public async translate(options: {
    text?: string;
    documentId?: string;
    targetLanguage: string;
    sourceLanguage?: string;
    domain?: string;
    tone?: string;
  }): Promise<TranslationResult> {
    const res = await fetch(`${API_BASE}/translate`, {
      method: 'POST',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Translation failed');
    }

    return res.json();
  }

  public async getLanguages(): Promise<Language[]> {
    const res = await fetch(`${API_BASE}/translate/languages`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch languages');
    const data = await res.json();
    return data.languages || [];
  }

  public async getSummary(documentId: string): Promise<{ summary: string }> {
    const res = await fetch(`${API_BASE}/rag/summary`, {
      method: 'POST',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ documentId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch summary');
    }

    return res.json();
  }
}

export const api = new ApiService();
