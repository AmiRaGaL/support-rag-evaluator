import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_PROVIDER,
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

  async embed(text: string): Promise<number[]> {
    const embedding = await this.embeddingProvider.embed(text);
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
