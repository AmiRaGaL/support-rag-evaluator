import type { RetrievedChunk } from '../chat/chat.types';
import type { RagPrompt } from './llm.types';

const MAX_CHUNK_CONTENT_LENGTH = 1800;

export function buildRagPrompt(
  question: string,
  chunks: RetrievedChunk[],
): RagPrompt {
  const context = chunks
    .map(
      (chunk, index) => `Chunk ${index + 1}
chunkId: ${chunk.id}
documentTitle: ${chunk.documentTitle}
sourceKey: ${chunk.sourceKey}
chunkIndex: ${chunk.chunkIndex}
content:
${truncate(chunk.content, MAX_CHUNK_CONTENT_LENGTH)}`,
    )
    .join('\n\n---\n\n');

  return {
    system: [
      'You are a support assistant for a retrieval-augmented support system.',
      'Answer only from the retrieved support documentation in the user message.',
      'If the retrieved chunks do not support an answer, refuse.',
      'Every non-refusal answer must cite at least one retrieved chunk id.',
      'Return strict JSON only, with no markdown and no surrounding prose.',
      'The JSON object must have exactly these fields: answer, citationChunkIds, refusal, confidence.',
      'citationChunkIds must contain only chunkId values from the retrieved chunks.',
      'confidence must be a number from 0 to 1.',
    ].join(' '),
    user: [
      `Question: ${question.trim()}`,
      '',
      'Retrieved chunks:',
      context || '(none)',
      '',
      'Return JSON in this shape:',
      '{"answer":"string","citationChunkIds":["chunk_id"],"refusal":false,"confidence":0.8}',
    ].join('\n'),
  };
}

function truncate(text: string, maxLength: number): string {
  const compact = text.replace(/\s+/g, ' ').trim();

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 3).trimEnd()}...`;
}
