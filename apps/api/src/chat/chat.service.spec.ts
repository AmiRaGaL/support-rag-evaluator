import { RetrievalService } from '../retrieval/retrieval.service';
import { LlmService } from '../llm/llm.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  const retrievalService = {
    searchChunks: jest.fn(),
  };
  const llmService = {
    generateGroundedAnswer: jest.fn(),
  };

  beforeEach(() => {
    retrievalService.searchChunks.mockReset();
    llmService.generateGroundedAnswer.mockReset();
  });

  it('refuses empty questions without calling retrieval', async () => {
    llmService.generateGroundedAnswer.mockResolvedValue({
      status: 'refused',
      question: '',
      answer:
        'Ask a support question so I can look for an answer in the documentation.',
      citations: [],
      refusalReason: 'empty_question',
      retrievedChunkCount: 0,
    });
    const service = new ChatService(
      retrievalService as unknown as RetrievalService,
      llmService as unknown as LlmService,
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
    expect(llmService.generateGroundedAnswer).toHaveBeenCalledWith({
      question: '',
      chunks: [],
    });
  });

  it('passes normalized questions and retrieved chunks to the answer builder', async () => {
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
    retrievalService.searchChunks.mockResolvedValue({
      query: 'billing email',
      limit: 4,
      chunks,
    });
    llmService.generateGroundedAnswer.mockResolvedValue({
      status: 'answered',
      question: 'billing email',
      answer:
        'According to the retrieved support documentation:\n1. Billing email updates are in account settings.',
      citations: [],
      retrievedChunkCount: 1,
    });
    const service = new ChatService(
      retrievalService as unknown as RetrievalService,
      llmService as unknown as LlmService,
    );

    await service.answerQuestion({ question: ' billing email ', limit: 4 });

    expect(retrievalService.searchChunks).toHaveBeenCalledWith({
      query: 'billing email',
      limit: 4,
    });
    expect(llmService.generateGroundedAnswer).toHaveBeenCalledWith({
      question: 'billing email',
      chunks,
    });
  });
});
