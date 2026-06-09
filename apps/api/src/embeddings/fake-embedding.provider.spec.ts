import { EMBEDDING_DIMENSIONS } from './embedding-provider.interface';
import { FakeEmbeddingProvider } from './fake-embedding.provider';

describe('FakeEmbeddingProvider', () => {
  const provider = new FakeEmbeddingProvider();

  it('returns 1536-dimensional normalized vectors', async () => {
    const embedding = await provider.embed('How do I update billing details?');
    const magnitude = Math.sqrt(
      embedding.reduce((sum, value) => sum + value * value, 0),
    );

    expect(embedding).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(magnitude).toBeCloseTo(1, 8);
  });

  it('returns deterministic embeddings for the same input', async () => {
    const first = await provider.embed('Reset my password');
    const second = await provider.embed('Reset my password');

    expect(first).toEqual(second);
  });

  it('returns different embeddings for different inputs', async () => {
    const first = await provider.embed('Reset my password');
    const second = await provider.embed('Change invoice email');

    expect(first).not.toEqual(second);
  });
});
