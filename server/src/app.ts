import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { documentsRouter } from './routes/documents.js';
import { ragRouter } from './routes/rag.js';
import { translateRouter } from './routes/translate.js';
import { geminiService } from './services/gemini.js';
import { vectorStore } from './services/vectorStore.js';

export const app = express();

// CORS setup
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-api-key'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Healthcheck & System Status Handler
const healthHandler = (req: express.Request, res: express.Response) => {
  const apiKeyOverride = (req.headers['x-gemini-api-key'] as string) || undefined;
  const hasKey = geminiService.hasApiKey(apiKeyOverride);
  const docs = vectorStore.getDocuments();
  const chunks = vectorStore.getChunks();

  res.json({
    status: 'online',
    appName: 'DoraWi – AI Translator & RAG Assistant',
    version: '1.0.0',
    geminiConfigured: hasKey,
    stats: {
      documentCount: docs.length,
      chunkCount: chunks.length,
    },
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Feature Routes - support both with and without /api prefix
app.use('/api/documents', documentsRouter);
app.use('/documents', documentsRouter);

app.use('/api/rag', ragRouter);
app.use('/rag', ragRouter);

app.use('/api/translate', translateRouter);
app.use('/translate', translateRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err?.message || 'Internal Server Error' });
});

export default app;
