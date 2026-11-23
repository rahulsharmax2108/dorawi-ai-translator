import { Router, Request, Response } from 'express';
import multer from 'multer';
import { documentParser } from '../services/documentParser.js';
import { geminiService } from '../services/gemini.js';
import { vectorStore } from '../services/vectorStore.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

export const documentsRouter = Router();

function getParamId(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

/**
 * Upload single or multiple documents (.pdf, .docx, .txt, .md).
 */
documentsRouter.post('/upload', upload.array('files', 10), async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const apiKey = (req.headers['x-gemini-api-key'] as string) || undefined;

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files provided.' });
      return;
    }

    const processedDocs = [];

    for (const file of files) {
      // 1. Parse document into text and semantic chunks
      const parseResult = await documentParser.parseFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      // 2. Generate vector embeddings for each chunk
      const chunkTexts = parseResult.chunks.map((c) => c.content);
      const embeddings = await geminiService.getBatchEmbeddings(chunkTexts, apiKey);

      // 3. Attach embeddings to chunks
      const embeddedChunks = parseResult.chunks.map((chunk, idx) => ({
        ...chunk,
        embedding: embeddings[idx] || [],
      }));

      // 4. Store in Vector Store
      vectorStore.addDocument(
        {
          ...parseResult.metadata,
          chunkCount: embeddedChunks.length,
        },
        embeddedChunks
      );

      processedDocs.push({
        id: parseResult.metadata.id,
        name: parseResult.metadata.name,
        size: parseResult.metadata.size,
        chunkCount: embeddedChunks.length,
        charCount: parseResult.metadata.charCount,
      });
    }

    res.status(201).json({
      success: true,
      documents: processedDocs,
    });
  } catch (err: any) {
    console.error('Document upload error:', err);
    res.status(500).json({ error: err?.message || 'Failed to process document.' });
  }
});

/**
 * List all documents.
 */
documentsRouter.get('/', (_req: Request, res: Response) => {
  const docs = vectorStore.getDocuments();
  res.json({ documents: docs, total: docs.length });
});

/**
 * Get document details.
 */
documentsRouter.get('/:id', (req: Request, res: Response): void => {
  const docId = getParamId(req.params.id);
  const doc = vectorStore.getDocument(docId);
  if (!doc) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }
  res.json(doc);
});

/**
 * Get chunks of a document.
 */
documentsRouter.get('/:id/chunks', (req: Request, res: Response): void => {
  const docId = getParamId(req.params.id);
  const doc = vectorStore.getDocument(docId);
  if (!doc) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }
  const chunks = vectorStore.getChunks(docId);
  res.json({
    documentId: docId,
    documentName: doc.name,
    chunkCount: chunks.length,
    chunks: chunks.map((c) => ({
      id: c.id,
      chunkIndex: c.chunkIndex,
      charCount: c.charCount,
      preview: c.content.slice(0, 180) + '...',
      content: c.content,
      hasEmbedding: Boolean(c.embedding && c.embedding.length > 0),
    })),
  });
});

/**
 * Delete a document.
 */
documentsRouter.delete('/:id', (req: Request, res: Response): void => {
  const docId = getParamId(req.params.id);
  const deleted = vectorStore.deleteDocument(docId);
  if (!deleted) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }
  res.json({ success: true, message: 'Document deleted successfully.' });
});
