import type { ChatCitation, RetrievedChunk } from '../chat/chat.types';
import type { GroqGroundedAnswerJson, GroundedAnswer } from './llm.types';

export const SAFE_GROQ_REFUSAL_ANSWER =
  'I could not answer this from the retrieved support documentation.';

const EXPECTED_KEYS = new Set([
  'answer',
  'citationChunkIds',
  'refusal',
  'confidence',
]);

export function parseGroqGroundedAnswer(
  content: string,
  chunks: RetrievedChunk[],
): GroundedAnswer {
  try {
    const parsed = JSON.parse(content) as unknown;

    if (!isGroqAnswerJson(parsed)) {
      return safeGroqRefusal(chunks);
    }

    const confidence = clampConfidence(parsed.confidence);
    const answer = parsed.answer.trim();

    if (parsed.refusal) {
      return {
        answer: answer || SAFE_GROQ_REFUSAL_ANSWER,
        citations: [],
        refusal: true,
        confidence,
        retrievedChunks: chunks,
        refusalReason: 'unsupported_by_retrieved_chunks',
      };
    }

    const citations = toCitations(parsed.citationChunkIds, chunks);

    if (!answer || citations.length === 0) {
      return safeGroqRefusal(chunks);
    }

    return {
      answer,
      citations,
      refusal: false,
      confidence,
      retrievedChunks: chunks,
    };
  } catch {
    return safeGroqRefusal(chunks);
  }
}

export function safeGroqRefusal(chunks: RetrievedChunk[]): GroundedAnswer {
  return {
    answer: SAFE_GROQ_REFUSAL_ANSWER,
    citations: [],
    refusal: true,
    confidence: 0,
    retrievedChunks: chunks,
    refusalReason: 'invalid_llm_output',
  };
}

function toCitations(
  citationChunkIds: string[],
  chunks: RetrievedChunk[],
): ChatCitation[] {
  if (citationChunkIds.length === 0) {
    return [];
  }

  const chunksById = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  const seen = new Set<string>();
  const citations: ChatCitation[] = [];

  for (const chunkId of citationChunkIds) {
    if (seen.has(chunkId)) {
      continue;
    }

    const chunk = chunksById.get(chunkId);

    if (!chunk) {
      return [];
    }

    seen.add(chunkId);
    citations.push({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      sourceKey: chunk.sourceKey,
      chunkIndex: chunk.chunkIndex,
      snippet: truncate(chunk.content, 220),
    });
  }

  return citations;
}

function isGroqAnswerJson(value: unknown): value is GroqGroundedAnswerJson {
  if (!isRecord(value) || hasUnexpectedKeys(value)) {
    return false;
  }

  return (
    typeof value.answer === 'string' &&
    Array.isArray(value.citationChunkIds) &&
    value.citationChunkIds.every((id) => typeof id === 'string') &&
    typeof value.refusal === 'boolean' &&
    typeof value.confidence === 'number' &&
    Number.isFinite(value.confidence)
  );
}

function hasUnexpectedKeys(value: Record<string, unknown>): boolean {
  return Object.keys(value).some((key) => !EXPECTED_KEYS.has(key));
}

function clampConfidence(confidence: number): number {
  return Math.min(Math.max(confidence, 0), 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function truncate(text: string, maxLength: number): string {
  const compact = text.replace(/\s+/g, ' ').trim();

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 3).trimEnd()}...`;
}
