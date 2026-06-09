import { chunkText, estimateTokenCount } from './chunk-text';

describe('chunkText', () => {
  it('returns no chunks for empty input', () => {
    expect(chunkText('')).toEqual([]);
  });

  it('creates a single chunk for short input', () => {
    const chunks = chunkText('This is a short support document.');

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      chunkIndex: 0,
      content: 'This is a short support document.',
    });
    expect(chunks[0].tokenCountEstimate).toBeGreaterThan(0);
  });

  it('creates multiple chunks for long input', () => {
    const input = Array.from({ length: 20 }, (_, index) => {
      return `Paragraph ${index}. This is a repeated paragraph for chunking tests.`;
    }).join('\n\n');

    const chunks = chunkText(input, {
      maxChars: 200,
      overlapChars: 30,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[1].chunkIndex).toBe(1);
  });

  it('rejects invalid overlap values', () => {
    expect(() =>
      chunkText('hello', {
        maxChars: 100,
        overlapChars: 100,
      }),
    ).toThrow('overlapChars must be smaller than maxChars');
  });
});

describe('estimateTokenCount', () => {
  it('estimates token count from character length', () => {
    expect(estimateTokenCount('12345678')).toBe(2);
  });
});
