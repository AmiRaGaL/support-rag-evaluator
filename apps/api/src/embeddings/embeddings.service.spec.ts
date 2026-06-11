import { InternalServerErrorException } from '@nestjs/common';
import {
  EMBEDDING_DIMENSIONS,
  type EmbeddingProvider,
} from './embedding-provider.interface';
import { EmbeddingsService } from './embeddings.service';

function unitVector(): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  vector[0] = 1;
  return vector;
}

describe('EmbeddingsService', () => {
  it('returns vectors from a mocked provider when dimensions are valid', async () => {
    const embed = jest.fn().mockResolvedValue(unitVector());
    const provider: EmbeddingProvider = {
      providerName: 'mock',
      embed,
    };
    const service = new EmbeddingsService(provider);

    await expect(service.embed('Billing email updates')).resolves.toEqual(
      unitVector(),
    );
    expect(embed).toHaveBeenCalledWith('Billing email updates');
  });

  it('fails clearly before callers write mismatched dimensions', async () => {
    const embed = jest.fn().mockResolvedValue([1]);
    const provider: EmbeddingProvider = {
      providerName: 'mock',
      embed,
    };
    const service = new EmbeddingsService(provider);

    await expect(service.embed('Billing email updates')).rejects.toThrow(
      InternalServerErrorException,
    );
    await expect(service.embed('Billing email updates')).rejects.toThrow(
      'returned 1 dimensions; expected 1536',
    );
  });
});
