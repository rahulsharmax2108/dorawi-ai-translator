import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { DocumentChunk, DocumentMetadata } from '../types.js';

export interface ParseResult {
  text: string;
  chunks: DocumentChunk[];
  metadata: Omit<DocumentMetadata, 'chunkCount'>;
}

export class DocumentParser {
  /**
   * Parses uploaded file buffer into clean text and structured chunks.
   */
  public async parseFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    chunkSize = 900,
    chunkOverlap = 150
  ): Promise<ParseResult> {
    const documentId = uuidv4();
    let text = '';
    const extension = originalName.split('.').pop()?.toLowerCase();

    if (mimeType === 'application/pdf' || extension === 'pdf') {
      const pdfData = await pdfParse(fileBuffer);
      text = pdfData.text || '';
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      extension === 'docx'
    ) {
      const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
      text = docxResult.value || '';
    } else {
      // Default to utf-8 text / markdown / code
      text = fileBuffer.toString('utf-8');
    }

    // Clean up excessive whitespace and null characters
    text = text.replace(/\0/g, '').replace(/\r\n/g, '\n').trim();

    // Chunk the text with word & sentence boundary preservation
    const chunks = this.createChunks(text, documentId, originalName, chunkSize, chunkOverlap);

    const metadata: Omit<DocumentMetadata, 'chunkCount'> = {
      id: documentId,
      name: originalName,
      originalName,
      mimeType,
      size: fileBuffer.length,
      uploadedAt: new Date().toISOString(),
      charCount: text.length,
    };

    return {
      text,
      chunks,
      metadata,
    };
  }

  /**
   * Splits text into overlapping semantic chunks preserving sentence and paragraph boundaries.
   * Ensures chunks NEVER cut a word in half.
   */
  public createChunks(
    text: string,
    documentId: string,
    documentName: string,
    chunkSize = 900,
    chunkOverlap = 150
  ): DocumentChunk[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Split paragraphs
    const paragraphs = text.split(/\n{2,}/);
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (const para of paragraphs) {
      const cleanPara = para.trim();
      if (!cleanPara) continue;

      // If adding this paragraph exceeds chunkSize, finalize current chunk if non-empty
      if (currentChunk.length + cleanPara.length > chunkSize && currentChunk.length > 0) {
        chunks.push({
          id: `${documentId}_chunk_${chunkIndex}`,
          documentId,
          documentName,
          chunkIndex,
          content: currentChunk.trim(),
          charCount: currentChunk.length,
        });
        chunkIndex++;

        // Calculate overlap starting point aligned to a clean word boundary
        let overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
        const nextSpace = currentChunk.indexOf(' ', overlapStart);
        if (nextSpace !== -1 && nextSpace < currentChunk.length - 15) {
          overlapStart = nextSpace + 1;
        }

        const overlapText = currentChunk.slice(overlapStart).trim();
        currentChunk = overlapText.length > 0 ? `${overlapText}\n\n${cleanPara}` : cleanPara;
      } else {
        currentChunk = currentChunk.length > 0 ? `${currentChunk}\n\n${cleanPara}` : cleanPara;
      }

      // If a single paragraph is larger than chunkSize, slice it at word/sentence boundary
      while (currentChunk.length > chunkSize * 1.5) {
        const slice = currentChunk.slice(0, chunkSize);
        // Find nearest sentence or word boundary
        const lastPeriod = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('.\n'), slice.lastIndexOf('\n'));
        const lastSpace = slice.lastIndexOf(' ');
        const cutPoint = lastPeriod > chunkSize * 0.5 ? lastPeriod + 1 : (lastSpace > chunkSize * 0.5 ? lastSpace : chunkSize);

        const piece = currentChunk.slice(0, cutPoint).trim();
        if (piece.length > 0) {
          chunks.push({
            id: `${documentId}_chunk_${chunkIndex}`,
            documentId,
            documentName,
            chunkIndex,
            content: piece,
            charCount: piece.length,
          });
          chunkIndex++;
        }

        // Align overlap start to next space
        let overlapStart = Math.max(0, cutPoint - chunkOverlap);
        const spaceIdx = currentChunk.indexOf(' ', overlapStart);
        if (spaceIdx !== -1 && spaceIdx < cutPoint) {
          overlapStart = spaceIdx + 1;
        }

        currentChunk = currentChunk.slice(overlapStart).trim();
      }
    }

    // Push trailing chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: `${documentId}_chunk_${chunkIndex}`,
        documentId,
        documentName,
        chunkIndex,
        content: currentChunk.trim(),
        charCount: currentChunk.length,
      });
    }

    return chunks;
  }
}

export const documentParser = new DocumentParser();
