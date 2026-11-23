# DoraWi – AI Translator & RAG Assistant
**Full-Stack RAG & Contextual Multilingual Translation Platform**  
*Built with React.js, Node.js, Google Gemini LLM, and Vector Embeddings.*

---

## 🌟 Highlights & Capabilities

- **Intelligent Document Ingestion & Parsing**: Native processing of **PDF**, **DOCX**, **TXT**, and **Markdown** with semantic boundary preservation and paragraph overlap.
- **Dense Vector Embeddings & Hybrid Search**: Computes 768-dimensional dense vectors using Google Gemini's `text-embedding-004` alongside lexical BM25 token boost for low-latency top-$k$ retrieval.
- **Agentic RAG Assistant**:
  - Automatically classifies query intent (*Fact Retrieval, Executive Synthesis, Comparative Analysis, Procedural Guidance*).
  - Retrieves grounded document chunks.
  - Streams synthesis in real-time with inline source citations linking directly to exact document excerpts and relevance percentages.
- **Agentic Contextual Multilingual Translation**:
  - **Phase 1 (Domain & Terminology Discovery)**: Automatically generates an industry-specific terminology glossary (Technical, Medical, Legal, Business, Creative).
  - **Phase 2 (Context-Aware Segment Translation)**: Translates text while carrying forward prior conversational context and strictly enforcing domain jargon consistency.
  - **Phase 3 (Format Integrity Polish)**: Preserves Markdown formatting, tables, code blocks, lists, and indentation.
- **Split-Pane Translation Workstation**: Dual-pane source vs. target document viewer with one-click copy, markdown export, and language selector covering 16+ world languages.
- **Interactive Knowledge Base**: Inspect individual chunk splits, character counts, and 768-d vector embedding statuses.

---

## 🏗️ Architecture

```
dorawi-ai-translator/
├── client/                     # Frontend (React 18, Vite, Tailwind CSS, Lucide)
│   ├── src/
│   │   ├── components/         # RagAssistant, TranslatorWorkstation, DocumentManager, ApiKeyModal
│   │   ├── services/api.ts     # Client API & SSE streaming handler
│   │   ├── types.ts            # Shared TypeScript interfaces
│   │   └── App.tsx             # Main dashboard
├── server/                     # Backend (Node.js, Express, TypeScript, ESM)
│   ├── src/
│   │   ├── services/
│   │   │   ├── gemini.ts           # Google Gemini 2.0 Flash & text-embedding-004 client
│   │   │   ├── documentParser.ts   # pdf-parse, mammoth, recursive chunking
│   │   │   ├── vectorStore.ts      # Cosine similarity vector index + hybrid lexical scoring
│   │   │   ├── ragAgent.ts         # Agentic intent routing & grounded RAG synthesis
│   │   │   └── translationAgent.ts # 3-Phase terminology-preserving translation agent
│   │   ├── routes/
│   │   │   ├── documents.ts        # Multipart upload, chunk inspection, document CRUD
│   │   │   ├── rag.ts              # SSE chat stream & executive summary
│   │   │   └── translate.ts        # Contextual multilingual translation
│   │   └── index.ts            # Server entrypoint (Port 5001)
└── package.json                # Root orchestration scripts
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v20/v26)
- **npm** or **pnpm** / **yarn**

### 2. Configure Your Environment
Create your server configuration:
```bash
cp server/.env.example server/.env
```
Inside `server/.env`:
```env
PORT=5001
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=text-embedding-004
```
*(Note: You can also launch without an API key; DoraWi operates in Demo Mode and lets you connect your key directly via the in-app Settings modal!)*

### 3. Run the Development Servers
From the root directory:
```bash
# Start both Backend (Port 5001) and Frontend (Port 3000) concurrently:
npm run dev
```

Or run them in separate terminals:
```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:client
```

Open your browser at **http://localhost:3000**.

---

## 🌐 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, vector index stats & Gemini status |
| `POST` | `/api/documents/upload` | Upload & embed PDF/DOCX/TXT files (Multipart form) |
| `GET` | `/api/documents` | List indexed documents |
| `GET` | `/api/documents/:id/chunks` | Inspect chunk splits and vector embedding metadata |
| `DELETE` | `/api/documents/:id` | Remove document from vector index |
| `POST` | `/api/rag/chat` | Stream context-grounded RAG answers with citations (`SSE`) |
| `POST` | `/api/rag/summary` | Generate document executive summary |
| `POST` | `/api/translate` | Contextual multilingual translation with glossary extraction |
| `GET` | `/api/translate/languages` | Supported target languages list |
