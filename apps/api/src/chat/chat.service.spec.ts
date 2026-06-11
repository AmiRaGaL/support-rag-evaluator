import { Logger } from '@nestjs/common';
import { RetrievalService } from '../retrieval/retrieval.service';
import { LlmService } from '../llm/llm.service';
import { QueryLogsService } from '../query-logs/query-logs.service';
import type { ChatStreamEvent } from './chat.types';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  const retrievalService = {
    searchChunks: jest.fn(),
  };
  const llmService = {
    generateGroundedAnswerWithMetadata: jest.fn(),
    getProviderName: jest.fn(),
  };
  const queryLogsService = {
    createRagQueryLog: jest.fn(),
  };

  beforeEach(() => {
    retrievalService.searchChunks.mockReset();
    llmService.generateGroundedAnswerWithMetadata.mockReset();
    llmService.getProviderName.mockReset();
    llmService.getProviderName.mockReturnValue('deterministic');
    queryLogsService.createRagQueryLog.mockReset();
    queryLogsService.createRagQueryLog.mockResolvedValue({ id: 'log_1' });
  });

  it('refuses empty questions without calling retrieval', async () => {
    llmService.generateGroundedAnswerWithMetadata.mockResolvedValue({
      response: {
        status: 'refused',
        question: '',
        answer:
          'Ask a support question so I can look for an answer in the documentation.',
        citations: [],
        refusalReason: 'empty_question',
        retrievedChunkCount: 0,
      },
      confidence: 0,
    });
    const service = new ChatService(
      retrievalService as unknown as RetrievalService,
      llmService as unknown as LlmService,
      queryLogsService as unknown as QueryLogsService,
    );

    const result = await service.answerQuestion({ question: '   ', limit: 5 });

    expect(result).toEqual({
      status: 'refused',
      question: '',
      answer:
        'Ask a support question so I can look for an answer in the documentation.',
      citations: [],
      refusalReason: 'empty_question',
      retrievedChunkCount: 0,
    });
    expect(retrievalService.searchChunks).not.toHaveBeenCalled();
    expect(llmService.generateGroundedAnswerWithMetadata).toHaveBeenCalledWith({
      question: '',
      chunks: [],
    });
    expect(queryLogsService.createRagQueryLog).toHaveBeenCalledWith(
      expect.objectContaining({
        question: '',
        answer:
          'Ask a support question so I can look for an answer in the documentation.',
        refusal: true,
        confidence: 0,
        provider: 'deterministic',
        retrievedChunkCount: 0,
        retrievedChunks: [],
      }),
    );
  });

  it('logs retrieved chunks and citation usage after answering', async () => {
    const chunks = [
      {
        id: 'chunk_1',
        documentId: 'doc_1',
        documentTitle: 'Billing',
        sourceKey: 'billing',
        sourcePath: '/docs/billing.md',
        chunkIndex: 0,
        content: 'Billing email updates are in account settings.',
        tokenCount: null,
        metadata: null,
        distance: 0.2,
        score: 0.8,
      },
      {
        id: 'chunk_2',
        documentId: 'doc_2',
        documentTitle: 'Plans',
        sourceKey: 'plans',
        sourcePath: '/docs/plans.md',
        chunkIndex: 3,
        content: 'Plan changes happen from workspace settings.',
        tokenCount: 8,
        metadata: null,
        distance: 0.4,
        score: 0.6,
      },
    ];
    retrievalService.searchChunks.mockResolvedValue({
      query: 'billing email',
      limit: 4,
      chunks,
    });
    llmService.generateGroundedAnswerWithMetadata.mockResolvedValue({
      response: {
        status: 'answered',
        question: 'billing email',
        answer:
          'According to the retrieved support documentation:\n1. Billing email updates are in account settings.',
        citations: [
          {
            chunkId: 'chunk_1',
            documentId: 'doc_1',
            documentTitle: 'Billing',
            sourceKey: 'billing',
            chunkIndex: 0,
            snippet: 'Billing email updates are in account settings.',
          },
        ],
        retrievedChunkCount: 2,
      },
      confidence: 0.7,
    });
    const service = new ChatService(
      retrievalService as unknown as RetrievalService,
      llmService as unknown as LlmService,
      queryLogsService as unknown as QueryLogsService,
    );

    await service.answerQuestion({ question: ' billing email ', limit: 4 });

    expect(retrievalService.searchChunks).toHaveBeenCalledWith({
      query: 'billing email',
      limit: 4,
    });
    expect(llmService.generateGroundedAnswerWithMetadata).toHaveBeenCalledWith({
      question: 'billing email',
      chunks,
    });
    expect(queryLogsService.createRagQueryLog).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'billing email',
        answer:
          'According to the retrieved support documentation:\n1. Billing email updates are in account settings.',
        refusal: false,
        confidence: 0.7,
        provider: 'deterministic',
        retrievedChunkCount: 2,
        retrievedChunks: [
          {
            chunkId: 'chunk_1',
            documentId: 'doc_1',
            documentTitle: 'Billing',
            sourceKey: 'billing',
            chunkIndex: 0,
            similarity: 0.8,
            citationUsed: true,
          },
          {
            chunkId: 'chunk_2',
            documentId: 'doc_2',
            documentTitle: 'Plans',
            sourceKey: 'plans',
            chunkIndex: 3,
            similarity: 0.6,
            citationUsed: false,
          },
        ],
      }),
    );
  });

  it('returns the chat response when logging fails', async () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const chunks = [
      {
        id: 'chunk_1',
        documentId: 'doc_1',
        documentTitle: 'Billing',
        sourceKey: 'billing',
        sourcePath: '/docs/billing.md',
        chunkIndex: 0,
        content: 'Billing email updates are in account settings.',
        tokenCount: null,
        metadata: null,
        distance: 0.2,
        score: 0.8,
      },
    ];
    const response = {
      status: 'answered' as const,
      question: 'billing email',
      answer: 'Billing email updates are in account settings.',
      citations: [],
      retrievedChunkCount: 1,
    };

    retrievalService.searchChunks.mockResolvedValue({
      query: 'billing email',
      limit: 4,
      chunks,
    });
    llmService.generateGroundedAnswerWithMetadata.mockResolvedValue({
      response,
      confidence: 0.7,
    });
    queryLogsService.createRagQueryLog.mockRejectedValue(
      new Error('database unavailable'),
    );
    const service = new ChatService(
      retrievalService as unknown as RetrievalService,
      llmService as unknown as LlmService,
      queryLogsService as unknown as QueryLogsService,
    );

    await expect(
      service.answerQuestion({ question: ' billing email ', limit: 4 }),
    ).resolves.toEqual(response);
    expect(loggerSpy).toHaveBeenCalledWith(
      'Failed to persist RAG query log.',
      expect.any(String),
    );
    loggerSpy.mockRestore();
  });

  it('streams deterministic answer chunks and a final complete event', async () => {
    const answer =
      'According to the retrieved support documentation: billing exports are available in workspace billing settings.';
    const chunks = [
      {
        id: 'chunk_1',
        documentId: 'doc_1',
        documentTitle: 'Billing',
        sourceKey: 'billing',
        sourcePath: '/docs/billing.md',
        chunkIndex: 0,
        content: 'Billing exports are available in workspace billing settings.',
        tokenCount: null,
        metadata: null,
        distance: 0.2,
        score: 0.8,
      },
    ];
    retrievalService.searchChunks.mockResolvedValue({
      query: 'billing exports',
      limit: 4,
      chunks,
    });
    llmService.generateGroundedAnswerWithMetadata.mockResolvedValue({
      response: {
        status: 'answered',
        question: 'billing exports',
        answer,
        citations: [
          {
            chunkId: 'chunk_1',
            documentId: 'doc_1',
            documentTitle: 'Billing',
            sourceKey: 'billing',
            chunkIndex: 0,
            snippet:
              'Billing exports are available in workspace billing settings.',
          },
        ],
        retrievedChunkCount: 1,
      },
      confidence: 0.7,
    });
    const service = new ChatService(
      retrievalService as unknown as RetrievalService,
      llmService as unknown as LlmService,
      queryLogsService as unknown as QueryLogsService,
    );

    const events: ChatStreamEvent[] = [];

    for await (const event of service.streamAnswerQuestion({
      question: ' billing exports ',
      limit: 4,
    })) {
      events.push(event);
    }

    expect(
      events.filter((event) => event.type === 'answer_delta').length,
    ).toBeGreaterThan(1);
    expect(
      events
        .filter((event) => event.type === 'answer_delta')
        .map((event) => event.text)
        .join(''),
    ).toBe(answer);

    const completeEvent = events.at(-1);

    expect(completeEvent?.type).toBe('complete');

    if (completeEvent?.type !== 'complete') {
      throw new Error('Expected final chat stream event to be complete.');
    }

    expect(completeEvent.response.status).toBe('answered');
    expect(completeEvent.response.answer).toBe(answer);
    expect(completeEvent.confidence).toBe(0.7);
    expect(completeEvent.retrievedChunks).toEqual([
      {
        chunkId: 'chunk_1',
        documentId: 'doc_1',
        documentTitle: 'Billing',
        sourceKey: 'billing',
        chunkIndex: 0,
        similarity: 0.8,
        citationUsed: true,
      },
    ]);
  });
});
