import { InternalServerErrorException } from '@nestjs/common';
import { EMBEDDING_DIMENSIONS } from '../embeddings/embedding-provider.interface';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { PrismaService } from '../prisma/prisma.service';
import { RetrievalService } from './retrieval.service';

function unitVector(): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  vector[0] = 1;
  return vector;
}

function mockArg(
  mock: jest.Mock,
  callIndex: number,
  argIndex: number,
): unknown {
  const calls = mock.mock.calls as unknown[][];
  return calls[callIndex]?.[argIndex];
}

describe('RetrievalService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };
  const embeddingsService = {
    embed: jest.fn(),
  };

  beforeEach(() => {
    prisma.$queryRaw.mockReset();
    prisma.$executeRaw.mockReset();
    embeddingsService.embed.mockReset();
  });

  it('embeds missing chunks with a validated vector literal parameter', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'chunk_1',
        content: 'Billing email updates',
      },
    ]);
    prisma.$executeRaw.mockResolvedValue(1);
    embeddingsService.embed.mockResolvedValue(unitVector());
    const service = new RetrievalService(
      prisma as unknown as PrismaService,
      embeddingsService as unknown as EmbeddingsService,
    );

    const result = await service.embedMissingChunks();

    expect(result).toEqual({ embeddedCount: 1 });
    expect(embeddingsService.embed).toHaveBeenCalledWith(
      'Billing email updates',
    );
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    expect(mockArg(prisma.$executeRaw, 0, 1)).toBe(
      `[${unitVector().join(',')}]`,
    );
    expect(mockArg(prisma.$executeRaw, 0, 2)).toBe('chunk_1');
  });

  it('clamps search limits and keeps vector and limit values parameterized', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'chunk_1',
        documentId: 'doc_1',
        documentTitle: 'Billing',
        sourceKey: 'billing',
        sourcePath: '/docs/billing.md',
        chunkIndex: 0,
        content: 'Billing email updates',
        tokenCount: null,
        metadata: null,
        distance: '0.25',
      },
    ]);
    embeddingsService.embed.mockResolvedValue(unitVector());
    const service = new RetrievalService(
      prisma as unknown as PrismaService,
      embeddingsService as unknown as EmbeddingsService,
    );

    const result = await service.searchChunks({
      query: ' billing email ',
      limit: 999,
    });

    expect(result).toEqual({
      query: 'billing email',
      limit: 50,
      chunks: [
        {
          id: 'chunk_1',
          documentId: 'doc_1',
          documentTitle: 'Billing',
          sourceKey: 'billing',
          sourcePath: '/docs/billing.md',
          chunkIndex: 0,
          content: 'Billing email updates',
          tokenCount: null,
          metadata: null,
          distance: 0.25,
          score: 0.75,
        },
      ],
    });
    expect(mockArg(prisma.$queryRaw, 0, 1)).toBe(`[${unitVector().join(',')}]`);
    expect(mockArg(prisma.$queryRaw, 0, 2)).toBe(`[${unitVector().join(',')}]`);
    expect(mockArg(prisma.$queryRaw, 0, 3)).toBe(50);
  });

  it('does not query vector search for blank queries', async () => {
    const service = new RetrievalService(
      prisma as unknown as PrismaService,
      embeddingsService as unknown as EmbeddingsService,
    );

    const result = await service.searchChunks({
      query: '   ',
      limit: 10,
    });

    expect(result).toEqual({
      query: '',
      limit: 10,
      chunks: [],
    });
    expect(embeddingsService.embed).not.toHaveBeenCalled();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('rejects embeddings with the wrong vector dimension', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'chunk_1',
        content: 'Billing email updates',
      },
    ]);
    embeddingsService.embed.mockResolvedValue([1]);
    const service = new RetrievalService(
      prisma as unknown as PrismaService,
      embeddingsService as unknown as EmbeddingsService,
    );

    await expect(service.embedMissingChunks()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('rejects unexpected raw SQL result shapes', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'chunk_1',
        distance: 0.25,
      },
    ]);
    embeddingsService.embed.mockResolvedValue(unitVector());
    const service = new RetrievalService(
      prisma as unknown as PrismaService,
      embeddingsService as unknown as EmbeddingsService,
    );

    await expect(
      service.searchChunks({ query: 'billing', limit: 5 }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
