import { ConfigService } from '@nestjs/config';
import { GroundedAnswerService } from '../chat/grounded-answer.service';
import { DeterministicLlmProvider } from './deterministic-llm.provider';
import { GroqLlmProvider } from './groq-llm.provider';
import { createLlmProvider } from './llm.module';

describe('createLlmProvider', () => {
  const groundedAnswerService = new GroundedAnswerService();

  it('defaults to deterministic without reading GROQ_API_KEY', () => {
    const getOrThrow = jest.fn();
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
      getOrThrow,
    } as unknown as ConfigService;

    const provider = createLlmProvider(configService, groundedAnswerService);

    expect(provider).toBeInstanceOf(DeterministicLlmProvider);
    expect(getOrThrow).not.toHaveBeenCalled();
  });

  it('uses deterministic for non-groq provider values', () => {
    const getOrThrow = jest.fn();
    const configService = {
      get: jest.fn().mockReturnValue('deterministic'),
      getOrThrow,
    } as unknown as ConfigService;

    const provider = createLlmProvider(configService, groundedAnswerService);

    expect(provider).toBeInstanceOf(DeterministicLlmProvider);
    expect(getOrThrow).not.toHaveBeenCalled();
  });

  it('constructs Groq only when LLM_PROVIDER=groq', () => {
    const getOrThrow = jest.fn().mockReturnValue('test_groq_key');
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'LLM_PROVIDER') {
          return 'groq';
        }

        if (key === 'GROQ_CHAT_MODEL') {
          return 'llama-3.1-8b-instant';
        }

        return undefined;
      }),
      getOrThrow,
    } as unknown as ConfigService;

    const provider = createLlmProvider(configService, groundedAnswerService);

    expect(provider).toBeInstanceOf(GroqLlmProvider);
    expect(getOrThrow).toHaveBeenCalledWith('GROQ_API_KEY');
  });
});
