import { RetrievalService } from '../retrieval/retrieval.service';
import { ChatService } from './chat.service';
import { GroundedAnswerService } from './grounded-answer.service';

describe('ChatService', () => {
  const retrievalService = {
    searchChunks: jest.fn(),
  };
  const groundedAnswerService = {
    buildAnswer: jest.fn(),
  };

  beforeEach(() => {
    retrievalService.searchChunks.mockReset();
    groundedAnswerService.buildAnswer.mockReset();
  });

  it('refuses empty questions without calling retrieval', async () => {
    groundedAnswerService.buildAnswer.mockReturnValue({
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
      groundedAnswerService as unknown as GroundedAnswerService,
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
    expect(groundedAnswerService.buildAnswer).toHaveBeenCalledWith('', []);
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
    groundedAnswerService.buildAnswer.mockReturnValue({
      status: 'answered',
      question: 'billing email',
      answer:
        'According to the retrieved support documentation:\n1. Billing email updates are in account settings.',
      citations: [],
      retrievedChunkCount: 1,
    });
    const service = new ChatService(
      retrievalService as unknown as RetrievalService,
      groundedAnswerService as unknown as GroundedAnswerService,
    );

    await service.answerQuestion({ question: ' billing email ', limit: 4 });

    expect(retrievalService.searchChunks).toHaveBeenCalledWith({
      query: 'billing email',
      limit: 4,
    });
    expect(groundedAnswerService.buildAnswer).toHaveBeenCalledWith(
      'billing email',
      chunks,
    );
  });
});
