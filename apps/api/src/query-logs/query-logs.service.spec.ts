import { PrismaService } from '../prisma/prisma.service';
import { QueryLogsService } from './query-logs.service';

describe('QueryLogsService', () => {
  const prisma = {
    ragQuery: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    prisma.ragQuery.create.mockReset();
    prisma.ragQuery.findMany.mockReset();
    prisma.ragQuery.findUnique.mockReset();
  });

  it('creates a RAG query log with retrieved chunk metadata', async () => {
    prisma.ragQuery.create.mockResolvedValue({ id: 'query_1' });
    const service = new QueryLogsService(prisma as unknown as PrismaService);

    await expect(
      service.createRagQueryLog({
        question: 'How do I update billing email?',
        answer: 'Use account settings.',
        refusal: false,
        confidence: 0.7,
        provider: 'deterministic',
        retrievedChunkCount: 1,
        latencyMs: 42,
        retrievedChunks: [
          {
            chunkId: 'chunk_1',
            documentId: 'doc_1',
            documentTitle: 'Billing',
            sourceKey: 'billing',
            chunkIndex: 0,
            similarity: 0.83,
            citationUsed: true,
          },
        ],
      }),
    ).resolves.toEqual({ id: 'query_1' });

    expect(prisma.ragQuery.create).toHaveBeenCalledWith({
      data: {
        question: 'How do I update billing email?',
        answer: 'Use account settings.',
        refusal: false,
        confidence: 0.7,
        provider: 'deterministic',
        retrievedChunkCount: 1,
        latencyMs: 42,
        retrievedChunks: {
          create: [
            {
              chunkId: 'chunk_1',
              documentId: 'doc_1',
              documentTitle: 'Billing',
              sourceKey: 'billing',
              chunkIndex: 0,
              similarity: 0.83,
              citationUsed: true,
            },
          ],
        },
      },
    });
  });

  it('lists recent RAG query logs in descending creation order', async () => {
    prisma.ragQuery.findMany.mockResolvedValue([{ id: 'query_2' }]);
    const service = new QueryLogsService(prisma as unknown as PrismaService);

    await expect(service.listRecentRagQueryLogs(10)).resolves.toEqual([
      { id: 'query_2' },
    ]);

    expect(prisma.ragQuery.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        retrievedChunks: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  });

  it('finds one RAG query log with retrieved chunks by id', async () => {
    prisma.ragQuery.findUnique.mockResolvedValue({ id: 'query_1' });
    const service = new QueryLogsService(prisma as unknown as PrismaService);

    await expect(service.findRagQueryLogById('query_1')).resolves.toEqual({
      id: 'query_1',
    });

    expect(prisma.ragQuery.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'query_1',
      },
      include: {
        retrievedChunks: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  });
});
