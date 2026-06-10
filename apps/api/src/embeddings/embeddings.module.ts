import { Module } from '@nestjs/common';
import { EMBEDDING_PROVIDER } from './embedding-provider.interface';
import { EmbeddingsService } from './embeddings.service';
import { FakeEmbeddingProvider } from './fake-embedding.provider';

@Module({
  providers: [
    FakeEmbeddingProvider,
    {
      provide: EMBEDDING_PROVIDER,
      useExisting: FakeEmbeddingProvider,
    },
    EmbeddingsService,
  ],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
