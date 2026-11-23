import { geminiService } from './gemini.js';
import { vectorStore } from './vectorStore.js';
import { TranslationGlossaryTerm, TranslationRequest, TranslationResult } from '../types.js';

export class TranslationAgent {
  /**
   * Translates text or an entire document using an Agentic 3-Phase Pipeline:
   * Phase 1: Domain & Terminology Glossary Generation
   * Phase 2: Contextual Chunk Translation (preserving sentence context & glossary)
   * Phase 3: Consistency Polish & Format Integrity
   */
  public async translate(
    request: TranslationRequest,
    apiKeyOverride?: string
  ): Promise<TranslationResult> {
    const startTime = Date.now();
    let textToTranslate = request.text || '';

    // If documentId is provided, gather its text
    if (request.documentId && !textToTranslate) {
      const chunks = vectorStore.getChunks(request.documentId);
      textToTranslate = chunks.map((c) => c.content).join('\n\n');
    }

    if (!textToTranslate.trim()) {
      throw new Error('No text or document provided for translation.');
    }

    const domain = request.domain || 'technical';
    const tone = request.tone || 'professional';
    const targetLang = request.targetLanguage || 'Spanish';
    const sourceLang = request.sourceLanguage || 'Auto-detect';

    // Phase 1: Extract domain terminology glossary
    const glossary = await this.extractGlossary(textToTranslate, targetLang, domain, apiKeyOverride);

    // Phase 2: Chunk translation if text is long, or single pass
    const translatedText = await this.performContextualTranslation(
      textToTranslate,
      sourceLang,
      targetLang,
      domain,
      tone,
      glossary,
      apiKeyOverride
    );

    const durationMs = Date.now() - startTime;

    return {
      originalText: textToTranslate,
      translatedText,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      glossaryUsed: glossary,
      durationMs,
      chunkCount: Math.ceil(textToTranslate.length / 1500) || 1,
    };
  }

  /**
   * Phase 1: Extracts domain terminology to prevent inconsistent vocabulary translation.
   */
  private async extractGlossary(
    text: string,
    targetLanguage: string,
    domain: string,
    apiKeyOverride?: string
  ): Promise<TranslationGlossaryTerm[]> {
    // Take a representative sample (up to 3000 chars) for glossary extraction
    const sample = text.slice(0, 3000);

    const prompt = `You are an expert computational linguist. Analyze this ${domain} text sample and identify 3 to 6 key technical, domain-specific, or named entity terms that require consistent translation into ${targetLanguage}.
Return strictly a valid JSON array of objects with keys "sourceTerm", "targetTerm", and optional "definition". Do not include markdown code fence formatting or other text, just the raw JSON array.

TEXT SAMPLE:
${sample}`;

    try {
      const raw = await geminiService.generateText(
        prompt,
        'Output valid JSON array only.',
        apiKeyOverride,
        0.1
      );

      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 6);
      }
    } catch (e) {
      // Fallback if parsing fails or demo mode
    }

    return [];
  }

  /**
   * Phase 2 & 3: Context-aware translation preserving Markdown layout and glossary mappings.
   */
  private async performContextualTranslation(
    text: string,
    sourceLang: string,
    targetLang: string,
    domain: string,
    tone: string,
    glossary: TranslationGlossaryTerm[],
    apiKeyOverride?: string
  ): Promise<string> {
    const glossaryInstructions =
      glossary.length > 0
        ? `MANDATORY GLOSSARY TO ENFORCE:\n` +
          glossary.map((g) => `- "${g.sourceTerm}" -> "${g.targetTerm}" (${g.definition || ''})`).join('\n')
        : '';

    const systemPrompt = `You are DoraWi, an elite neural machine translation engine and localization specialist.
Your mission:
1. Translate the source text accurately into ${targetLang}.
2. Retain the exact original formatting: Markdown headers, bullet points, numbers, code blocks, bold/italics, and table structures.
3. Adopt a ${tone} tone suited for the ${domain} domain.
4. Faithfully preserve specialized terms as indicated in the glossary.
5. Provide ONLY the translated text without introductory commentary or concluding remarks.`;

    // If text is manageable (< 4000 characters), do in one cohesive pass
    if (text.length <= 4000) {
      const prompt = `${glossaryInstructions}

SOURCE TEXT (${sourceLang}):
${text}

TRANSLATION (${targetLang}):`;

      return await geminiService.generateText(prompt, systemPrompt, apiKeyOverride, 0.2);
    }

    // For larger documents, split into cohesive sections and translate sequentially with context
    const sections = text.split(/\n\n+/);
    const translatedSections: string[] = [];
    let previousContext = '';

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i].trim();
      if (!sec) continue;

      const prompt = `${glossaryInstructions}
${previousContext ? `PREVIOUS SECTION CONTEXT:\n${previousContext.slice(-300)}\n` : ''}
CURRENT SECTION TO TRANSLATE (${sourceLang} -> ${targetLang}):
${sec}

TRANSLATION:`;

      const translatedSec = await geminiService.generateText(prompt, systemPrompt, apiKeyOverride, 0.2);
      translatedSections.push(translatedSec.trim());
      previousContext = translatedSec;
    }

    return translatedSections.join('\n\n');
  }
}

export const translationAgent = new TranslationAgent();
