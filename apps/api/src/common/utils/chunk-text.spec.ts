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

  it('prefers paragraph boundaries when a clean split is available', () => {
    const input = [
      'First paragraph has enough text.',
      'Second paragraph should start a new chunk.',
    ].join('\n\n');

    const chunks = chunkText(input, {
      maxChars: 60,
      overlapChars: 0,
    });

    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toBe('First paragraph has enough text.');
    expect(chunks[1].content).toBe(
      'Second paragraph should start a new chunk.',
    );
  });

  it('keeps chunks within maxChars for long text without natural breaks', () => {
    const chunks = chunkText('a'.repeat(55), {
      maxChars: 20,
      overlapChars: 5,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.content.length <= 20)).toBe(true);
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
