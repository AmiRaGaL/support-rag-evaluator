import { EMBEDDING_DIMENSIONS } from './embedding-provider.interface';
import {
  formatGeminiEmbeddingInput,
  GeminiEmbeddingProvider,
  parseGeminiEmbeddingResponse,
} from './gemini-embedding.provider';

function vector(length = EMBEDDING_DIMENSIONS): number[] {
  const values = new Array<number>(length).fill(0);
  values[0] = 1;
  return values;
}

describe('GeminiEmbeddingProvider', () => {
  it('sends outputDimensionality and returns a 1536-length vector', async () => {
    const embedContent = jest.fn().mockResolvedValue({
      embeddings: [{ values: vector() }],
    });
    const provider = new GeminiEmbeddingProvider({
      apiKey: 'test_gemini_key',
      model: 'gemini-embedding-2',
      dimensions: EMBEDDING_DIMENSIONS,
      client: {
        models: {
          embedContent,
        },
      },
    });

    const result = await provider.embed('How do I export billing history?', {
      purpose: 'query',
    });

    expect(result).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(embedContent).toHaveBeenCalledWith({
      model: 'gemini-embedding-2',
      contents:
        'task: question answering | query: How do I export billing history?',
      config: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    });
  });

  it('throws when GEMINI_API_KEY is missing', () => {
    expect(
      () =>
        new GeminiEmbeddingProvider({
          apiKey: '',
          dimensions: EMBEDDING_DIMENSIONS,
        }),
    ).toThrow('GEMINI_API_KEY is required when EMBEDDING_PROVIDER=gemini.');
  });

  it('formats document input with title and text', () => {
    expect(
      formatGeminiEmbeddingInput('Users can export billing history.', {
        purpose: 'document',
        title: 'Billing',
      }),
    ).toBe('title: Billing | text: Users can export billing history.');
  });

  it('formats document input with none when title is missing', () => {
    expect(
      formatGeminiEmbeddingInput('Users can export billing history.', {
        purpose: 'document',
      }),
    ).toBe('title: none | text: Users can export billing history.');
  });

  it('formats query input for question answering', () => {
    expect(
      formatGeminiEmbeddingInput('Can I export billing history?', {
        purpose: 'query',
      }),
    ).toBe('task: question answering | query: Can I export billing history?');
  });

  it('throws when Gemini returns the wrong dimension count', () => {
    expect(() =>
      parseGeminiEmbeddingResponse(
        {
          embeddings: [{ values: vector(3) }],
        },
        EMBEDDING_DIMENSIONS,
      ),
    ).toThrow(
      'Gemini embedding response returned 3 dimensions; expected 1536.',
    );
  });
});
