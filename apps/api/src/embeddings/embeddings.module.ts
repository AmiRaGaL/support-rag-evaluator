import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_PROVIDER,
  type EmbeddingProvider,
} from './embedding-provider.interface';
import { EmbeddingsService } from './embeddings.service';
import { FakeEmbeddingProvider } from './fake-embedding.provider';
import { OpenAiEmbeddingProvider } from './openai-embedding.provider';

export function createEmbeddingProvider(
  configService: ConfigService,
): EmbeddingProvider {
  const provider =
    configService.get<string>('EMBEDDING_PROVIDER')?.trim().toLowerCase() ??
    'deterministic';
  const dimensions = parseEmbeddingDimensions(
    configService.get<string | number>('EMBEDDING_DIMENSIONS'),
  );

  if (provider === 'openai') {
    return new OpenAiEmbeddingProvider({
      apiKey: configService.get<string>('EMBEDDING_API_KEY') ?? '',
      model: configService.get<string>('EMBEDDING_MODEL'),
      dimensions,
      baseURL: configService.get<string>('EMBEDDING_BASE_URL'),
    });
  }

  return new FakeEmbeddingProvider();
}

function parseEmbeddingDimensions(value: string | number | undefined): number {
  if (value === undefined || value === '') {
    return EMBEDDING_DIMENSIONS;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `EMBEDDING_DIMENSIONS must be a positive integer matching DocumentChunk.embedding vector(${EMBEDDING_DIMENSIONS}).`,
    );
  }

  if (parsed !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `EMBEDDING_DIMENSIONS=${parsed} does not match DocumentChunk.embedding vector(${EMBEDDING_DIMENSIONS}). Update the pgvector schema before changing embedding dimensions.`,
    );
  }

  return parsed;
}

@Module({
  providers: [
    {
      provide: EMBEDDING_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createEmbeddingProvider(configService),
    },
    EmbeddingsService,
  ],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
