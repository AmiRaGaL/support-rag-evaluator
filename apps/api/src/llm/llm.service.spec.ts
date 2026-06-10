import { LlmService } from './llm.service';
import type { LlmProvider } from './llm.types';

describe('LlmService', () => {
  const generateGroundedAnswer = jest.fn();
  const provider: jest.Mocked<LlmProvider> = {
    generateGroundedAnswer,
  };

  beforeEach(() => {
    generateGroundedAnswer.mockReset();
  });

  function service() {
    return new LlmService(provider);
  }

  it('refuses empty questions without calling the selected provider', async () => {
    const result = await service().generateGroundedAnswer({
      question: '   ',
      chunks: [],
    });

    expect(result).toEqual({
      status: 'refused',
      question: '',
      answer:
        'Ask a support question so I can look for an answer in the documentation.',
      citations: [],
      refusalReason: 'empty_question',
      retrievedChunkCount: 0,
    });
    expect(generateGroundedAnswer).not.toHaveBeenCalled();
  });

  it('refuses no retrieved chunks without calling the selected provider', async () => {
    const result = await service().generateGroundedAnswer({
      question: 'How do I update billing email?',
      chunks: [],
    });

    expect(result).toEqual({
      status: 'refused',
      question: 'How do I update billing email?',
      answer:
        'I could not find support documentation that answers this question.',
      citations: [],
      refusalReason: 'no_retrieved_chunks',
      retrievedChunkCount: 0,
    });
    expect(generateGroundedAnswer).not.toHaveBeenCalled();
  });
});
