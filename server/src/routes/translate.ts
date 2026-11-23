import { Router, Request, Response } from 'express';
import { translationAgent } from '../services/translationAgent.js';
import { TranslationRequest } from '../types.js';

export const translateRouter = Router();

const SUPPORTED_LANGUAGES = [
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

/**
 * Contextual Multilingual Translation
 */
translateRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const request = req.body as TranslationRequest;
  const apiKey = (req.headers['x-gemini-api-key'] as string) || undefined;

  if (!request.text && !request.documentId) {
    res.status(400).json({ error: 'Either "text" or "documentId" must be provided.' });
    return;
  }

  try {
    const result = await translationAgent.translate(request, apiKey);
    res.json(result);
  } catch (err: any) {
    console.error('Translation error:', err);
    res.status(500).json({ error: err?.message || 'Translation failed.' });
  }
});

/**
 * Get supported languages
 */
translateRouter.get('/languages', (_req: Request, res: Response) => {
  res.json({ languages: SUPPORTED_LANGUAGES });
});
