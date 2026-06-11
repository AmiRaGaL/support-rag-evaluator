import { ConfigService } from '@nestjs/config';
import { EMBEDDING_DIMENSIONS } from './embedding-provider.interface';
import { createEmbeddingProvider } from './embeddings.module';
import { FakeEmbeddingProvider } from './fake-embedding.provider';
import { OpenAiEmbeddingProvider } from './openai-embedding.provider';

function configServiceFor(values: Record<string, string | undefined>): {
  configService: ConfigService;
  get: jest.Mock;
} {
  const get = jest.fn((key: string) => values[key]);

  return {
    get,
    configService: {
      get,
    } as unknown as ConfigService,
  };
}

function getConfigKeys(get: jest.Mock): string[] {
  const calls = get.mock.calls as unknown[][];

  return calls.map((call) => String(call[0]));
}

describe('createEmbeddingProvider', () => {
  it('defaults to deterministic without reading EMBEDDING_API_KEY', () => {
    const { configService, get } = configServiceFor({});

    const provider = createEmbeddingProvider(configService);

    expect(provider).toBeInstanceOf(FakeEmbeddingProvider);
    expect(getConfigKeys(get)).not.toContain('EMBEDDING_API_KEY');
  });

  it('uses deterministic for explicit deterministic provider values', () => {
    const { configService, get } = configServiceFor({
      EMBEDDING_PROVIDER: 'deterministic',
      EMBEDDING_DIMENSIONS: String(EMBEDDING_DIMENSIONS),
    });

    const provider = createEmbeddingProvider(configService);

    expect(provider).toBeInstanceOf(FakeEmbeddingProvider);
    expect(getConfigKeys(get)).not.toContain('EMBEDDING_API_KEY');
  });

  it('constructs OpenAI only when EMBEDDING_PROVIDER=openai', () => {
    const { configService, get } = configServiceFor({
      EMBEDDING_PROVIDER: 'openai',
      EMBEDDING_API_KEY: 'test_embedding_key',
      EMBEDDING_MODEL: 'text-embedding-3-small',
      EMBEDDING_DIMENSIONS: String(EMBEDDING_DIMENSIONS),
      EMBEDDING_BASE_URL: 'https://example.test/v1',
    });

    const provider = createEmbeddingProvider(configService);

    expect(provider).toBeInstanceOf(OpenAiEmbeddingProvider);
    expect(getConfigKeys(get)).toContain('EMBEDDING_API_KEY');
  });

  it('fails clearly for missing API key only when OpenAI is configured', () => {
    const { configService } = configServiceFor({
      EMBEDDING_PROVIDER: 'openai',
    });

    expect(() => createEmbeddingProvider(configService)).toThrow(
      'EMBEDDING_API_KEY is required when EMBEDDING_PROVIDER=openai.',
    );
  });

  it('fails clearly when configured dimensions do not match pgvector schema', () => {
    const { configService } = configServiceFor({
      EMBEDDING_PROVIDER: 'deterministic',
      EMBEDDING_DIMENSIONS: '384',
    });

    expect(() => createEmbeddingProvider(configService)).toThrow(
      'does not match DocumentChunk.embedding vector(1536)',
    );
  });
});
