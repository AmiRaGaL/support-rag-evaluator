import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_PROVIDER,
  type EmbeddingInputOptions,
  type EmbeddingProvider,
} from './embedding-provider.interface';

@Injectable()
export class EmbeddingsService {
  constructor(
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  getProviderName(): string {
    return (
      this.embeddingProvider.providerName ||
      this.embeddingProvider.constructor.name
    );
  }

  getModelName(): string | undefined {
    return this.embeddingProvider.modelName;
  }

  getDimensions(): number {
    return this.embeddingProvider.dimensions ?? EMBEDDING_DIMENSIONS;
  }

  async embed(
    text: string,
    options: EmbeddingInputOptions = {},
  ): Promise<number[]> {
    const embedding = await this.embeddingProvider.embed(text, options);
    this.validateEmbedding(embedding);

    return embedding;
  }

  private validateEmbedding(embedding: number[]): void {
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new InternalServerErrorException(
        `Embedding provider "${this.getProviderName()}" returned ${embedding.length} dimensions; expected ${EMBEDDING_DIMENSIONS} to match DocumentChunk.embedding vector(${EMBEDDING_DIMENSIONS}).`,
      );
    }

    for (const value of embedding) {
      if (!Number.isFinite(value)) {
        throw new InternalServerErrorException(
          `Embedding provider "${this.getProviderName()}" returned a non-finite embedding value.`,
        );
      }
    }
  }
}
