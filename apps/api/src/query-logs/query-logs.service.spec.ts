import { PrismaService } from '../prisma/prisma.service';
import { QueryLogsService } from './query-logs.service';

describe('QueryLogsService', () => {
  it('creates a RAG query log with retrieved chunk metadata', async () => {
    const prisma = {
      ragQuery: {
        create: jest.fn().mockResolvedValue({ id: 'query_1' }),
      },
    };
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
});
