import { NotFoundException } from '@nestjs/common';
import { QueryLogsController } from './query-logs.controller';
import { QueryLogsService } from './query-logs.service';

describe('QueryLogsController', () => {
  const queryLogsService = {
    listRecentRagQueryLogs: jest.fn(),
    findRagQueryLogById: jest.fn(),
  };

  beforeEach(() => {
    queryLogsService.listRecentRagQueryLogs.mockReset();
    queryLogsService.findRagQueryLogById.mockReset();
  });

  it('returns recent query logs with a clamped limit', async () => {
    const createdAt = new Date('2026-06-10T00:00:00.000Z');
    queryLogsService.listRecentRagQueryLogs.mockResolvedValue([
      {
        id: 'query_1',
        question: 'How do I update billing email?',
        answer: 'Use account settings.',
        refusal: false,
        confidence: 0.7,
        provider: 'deterministic',
        retrievedChunkCount: 1,
        latencyMs: 42,
        createdAt,
        retrievedChunks: [
          {
            id: 'retrieved_1',
            ragQueryId: 'query_1',
            chunkId: 'chunk_1',
            documentId: 'doc_1',
            documentTitle: 'Billing',
            sourceKey: 'billing',
            chunkIndex: 0,
            similarity: 0.82,
            citationUsed: true,
            createdAt,
          },
        ],
      },
    ]);
    const controller = new QueryLogsController(
      queryLogsService as unknown as QueryLogsService,
    );

    await expect(controller.listQueryLogs('999')).resolves.toEqual([
      {
        id: 'query_1',
        question: 'How do I update billing email?',
        answer: 'Use account settings.',
        refusal: false,
        confidence: 0.7,
        provider: 'deterministic',
        retrievedChunkCount: 1,
        latencyMs: 42,
        createdAt,
        retrievedChunks: [
          {
            chunkId: 'chunk_1',
            documentId: 'doc_1',
            documentTitle: 'Billing',
            sourceKey: 'billing',
            chunkIndex: 0,
            similarity: 0.82,
            citationUsed: true,
          },
        ],
      },
    ]);
    expect(queryLogsService.listRecentRagQueryLogs).toHaveBeenCalledWith(50);
  });

  it('uses the default limit for invalid limit query values', async () => {
    queryLogsService.listRecentRagQueryLogs.mockResolvedValue([]);
    const controller = new QueryLogsController(
      queryLogsService as unknown as QueryLogsService,
    );

    await expect(controller.listQueryLogs('not-a-number')).resolves.toEqual([]);

    expect(queryLogsService.listRecentRagQueryLogs).toHaveBeenCalledWith(20);
  });

  it('returns one query log by id', async () => {
    const createdAt = new Date('2026-06-10T00:00:00.000Z');
    queryLogsService.findRagQueryLogById.mockResolvedValue({
      id: 'query_1',
      question: 'How do I update billing email?',
      answer: 'Use account settings.',
      refusal: false,
      confidence: 0.7,
      provider: 'deterministic',
      retrievedChunkCount: 0,
      latencyMs: 42,
      createdAt,
      retrievedChunks: [],
    });
    const controller = new QueryLogsController(
      queryLogsService as unknown as QueryLogsService,
    );

    await expect(controller.getQueryLog('query_1')).resolves.toEqual({
      id: 'query_1',
      question: 'How do I update billing email?',
      answer: 'Use account settings.',
      refusal: false,
      confidence: 0.7,
      provider: 'deterministic',
      retrievedChunkCount: 0,
      latencyMs: 42,
      createdAt,
      retrievedChunks: [],
    });
    expect(queryLogsService.findRagQueryLogById).toHaveBeenCalledWith(
      'query_1',
    );
  });

  it('throws NotFoundException when a query log does not exist', async () => {
    queryLogsService.findRagQueryLogById.mockResolvedValue(null);
    const controller = new QueryLogsController(
      queryLogsService as unknown as QueryLogsService,
    );

    await expect(controller.getQueryLog('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
