import { ConfigService } from '@nestjs/config';
import { GroundedAnswerService } from '../chat/grounded-answer.service';
import { DeterministicLlmProvider } from './deterministic-llm.provider';
import { GroqLlmProvider } from './groq-llm.provider';
import { createLlmProvider, resolveLlmProviderName } from './llm.module';

describe('createLlmProvider', () => {
  const groundedAnswerService = new GroundedAnswerService();

  it('defaults to deterministic in test without reading GROQ_API_KEY', () => {
    const getOrThrow = jest.fn();
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') {
          return 'test';
        }

        return undefined;
      }),
      getOrThrow,
    } as unknown as ConfigService;

    const provider = createLlmProvider(configService, groundedAnswerService);

    expect(provider).toBeInstanceOf(DeterministicLlmProvider);
    expect(getOrThrow).not.toHaveBeenCalled();
  });

  it('defaults to Groq outside test', () => {
    const getOrThrow = jest.fn().mockReturnValue('test_groq_key');
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') {
          return 'production';
        }

        return undefined;
      }),
      getOrThrow,
    } as unknown as ConfigService;

    const provider = createLlmProvider(configService, groundedAnswerService);

    expect(provider).toBeInstanceOf(GroqLlmProvider);
    expect(getOrThrow).toHaveBeenCalledWith('GROQ_API_KEY');
  });

  it('uses deterministic for explicit deterministic provider values', () => {
    const getOrThrow = jest.fn();
    const configService = {
      get: jest.fn().mockReturnValue('deterministic'),
      getOrThrow,
    } as unknown as ConfigService;

    const provider = createLlmProvider(configService, groundedAnswerService);

    expect(provider).toBeInstanceOf(DeterministicLlmProvider);
    expect(getOrThrow).not.toHaveBeenCalled();
  });

  it('fails clearly for unsupported provider values', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'LLM_PROVIDER') {
          return 'wat';
        }

        return undefined;
      }),
    } as unknown as ConfigService;

    expect(() => resolveLlmProviderName(configService)).toThrow(
      'Unsupported LLM_PROVIDER=wat. Supported values: deterministic, groq.',
    );
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
