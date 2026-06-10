import type { RetrievedChunk } from '../chat/chat.types';
import { buildRagPrompt } from './rag-prompt.builder';

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

describe('buildRagPrompt', () => {
  it('asks the model for strict grounded JSON', () => {
    const prompt = buildRagPrompt('Can I export billing history?', [chunk()]);

    expect(prompt.system).toContain(
      'Answer only from the retrieved support documentation',
    );
    expect(prompt.system).toContain('Return strict JSON only');
    expect(prompt.system).toContain(
      'answer, citationChunkIds, refusal, confidence',
    );
    expect(prompt.user).toContain('Question: Can I export billing history?');
    expect(prompt.user).toContain('chunkId: chunk_1');
    expect(prompt.user).toContain('sourceKey: billing');
    expect(prompt.user).toContain('Users can export billing history');
  });

  it('includes an explicit empty context marker when no chunks are retrieved', () => {
    const prompt = buildRagPrompt('Can I export audit logs?', []);

    expect(prompt.user).toContain('Retrieved chunks:');
    expect(prompt.user).toContain('(none)');
  });
});
