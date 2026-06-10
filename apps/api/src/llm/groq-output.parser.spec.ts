import type { RetrievedChunk } from '../chat/chat.types';
import {
  SAFE_GROQ_REFUSAL_ANSWER,
  parseGroqGroundedAnswer,
} from './groq-output.parser';

function chunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    id: 'chunk_1',
    documentId: 'doc_1',
    documentTitle: 'Billing',
    sourceKey: 'billing',
    sourcePath: '/docs/billing.md',
    chunkIndex: 0,
    content: 'Users can export billing history from billing settings.',
    tokenCount: null,
    metadata: null,
    distance: 0.1,
    score: 0.9,
    ...overrides,
  };
}

describe('parseGroqGroundedAnswer', () => {
  it('parses valid answers and maps citations from retrieved chunks', () => {
    const chunks = [chunk()];

    const result = parseGroqGroundedAnswer(
      JSON.stringify({
        answer: 'You can export billing history from billing settings.',
        citationChunkIds: ['chunk_1'],
        refusal: false,
        confidence: 0.83,
      }),
      chunks,
    );

    expect(result).toEqual({
      answer: 'You can export billing history from billing settings.',
      citations: [
        {
          chunkId: 'chunk_1',
          documentId: 'doc_1',
          documentTitle: 'Billing',
          sourceKey: 'billing',
          chunkIndex: 0,
          snippet: 'Users can export billing history from billing settings.',
        },
      ],
      refusal: false,
      confidence: 0.83,
      retrievedChunks: chunks,
    });
  });

  it('refuses when model output is not JSON', () => {
    const result = parseGroqGroundedAnswer('not json', [chunk()]);

    expect(result).toMatchObject({
      answer: SAFE_GROQ_REFUSAL_ANSWER,
      citations: [],
      refusal: true,
      confidence: 0,
      refusalReason: 'invalid_llm_output',
    });
  });

  it('refuses when citationChunkIds is missing or empty for an answer', () => {
    const result = parseGroqGroundedAnswer(
      JSON.stringify({
        answer: 'You can export billing history.',
        citationChunkIds: [],
        refusal: false,
        confidence: 0.8,
      }),
      [chunk()],
    );

    expect(result).toMatchObject({
      citations: [],
      refusal: true,
      refusalReason: 'invalid_llm_output',
    });
  });

  it('refuses when a citation id is not from retrieved chunks', () => {
    const result = parseGroqGroundedAnswer(
      JSON.stringify({
        answer: 'You can export billing history.',
        citationChunkIds: ['unknown_chunk'],
        refusal: false,
        confidence: 0.8,
      }),
      [chunk()],
    );

    expect(result).toMatchObject({
      citations: [],
      refusal: true,
      refusalReason: 'invalid_llm_output',
    });
  });

  it('refuses output with unexpected fields instead of accepting loose JSON', () => {
    const result = parseGroqGroundedAnswer(
      JSON.stringify({
        answer: 'You can export billing history.',
        citationChunkIds: ['chunk_1'],
        refusal: false,
        confidence: 0.8,
        unsupportedField: true,
      }),
      [chunk()],
    );

    expect(result).toMatchObject({
      citations: [],
      refusal: true,
      refusalReason: 'invalid_llm_output',
    });
  });

  it('returns model refusals without citations', () => {
    const chunks = [chunk()];

    const result = parseGroqGroundedAnswer(
      JSON.stringify({
        answer: 'I cannot answer this from the retrieved documentation.',
        citationChunkIds: [],
        refusal: true,
        confidence: 0.2,
      }),
      chunks,
    );

    expect(result).toEqual({
      answer: 'I cannot answer this from the retrieved documentation.',
      citations: [],
      refusal: true,
      confidence: 0.2,
      retrievedChunks: chunks,
      refusalReason: 'unsupported_by_retrieved_chunks',
    });
  });

  it('clamps confidence into the response range', () => {
    const result = parseGroqGroundedAnswer(
      JSON.stringify({
        answer: 'You can export billing history.',
        citationChunkIds: ['chunk_1'],
        refusal: false,
        confidence: 2,
      }),
      [chunk()],
    );

    expect(result.confidence).toBe(1);
  });
});
