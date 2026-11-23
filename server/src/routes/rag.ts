import { Router, Request, Response } from 'express';
import { ragAgent } from '../services/ragAgent.js';

export const ragRouter = Router();

/**
 * RAG Question Answering Endpoint with streaming and non-streaming support.
 */
ragRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  const { question, chatHistory = [], documentId, stream = true } = req.body;
  const apiKey = (req.headers['x-gemini-api-key'] as string) || undefined;

  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'Question is required.' });
    return;
  }

  // Handle SSE streaming
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const generator = ragAgent.streamAnswer(question, chatHistory, documentId, apiKey);

      for await (const chunk of generator) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.end();
    } catch (err: any) {
      console.error('RAG stream error:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', error: err?.message || 'Streaming failed' })}\n\n`);
      res.end();
    }
    return;
  }

  // Standard non-streaming JSON response
  try {
    const result = await ragAgent.answerQuestion(question, chatHistory, documentId, apiKey);
    res.json(result);
  } catch (err: any) {
    console.error('RAG chat error:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate answer.' });
  }
});

/**
 * Document Executive Summary
 */
ragRouter.post('/summary', async (req: Request, res: Response): Promise<void> => {
  const { documentId } = req.body;
  const apiKey = (req.headers['x-gemini-api-key'] as string) || undefined;

  if (!documentId) {
    res.status(400).json({ error: 'documentId is required.' });
    return;
  }

  try {
    const result = await ragAgent.summarizeDocument(documentId, apiKey);
    res.json(result);
  } catch (err: any) {
    console.error('Summary error:', err);
    res.status(500).json({ error: err?.message || 'Failed to summarize document.' });
  }
});
