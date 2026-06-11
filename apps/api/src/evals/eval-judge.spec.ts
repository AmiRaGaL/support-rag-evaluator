import { ConfigService } from '@nestjs/config';
import {
  DeterministicEvalJudgeProvider,
  createEvalJudgeProvider,
  parseEvalJudgeResult,
} from './eval-judge';
import type { BaselineEvalCase, EvalCaseResult } from './eval.types';

describe('eval judge providers', () => {
  it('returns stable deterministic judgments from baseline scoring', async () => {
    const provider = new DeterministicEvalJudgeProvider();

    await expect(
      provider.judge({
        evalCase: evalCase(),
        result: evalResult(),
      }),
    ).resolves.toEqual({
      provider: 'deterministic',
      score: 1,
      passed: true,
      reasoning:
        'Deterministic judge mirrored the baseline scoring dimensions.',
      dimensions: {
        groundedness: true,
        answerCorrectness: true,
        citationSupport: true,
        refusalBehavior: true,
      },
    });
  });

  it('does not read GROQ_API_KEY unless Groq judge mode is explicit', () => {
    const get = jest.fn((key: string) =>
      key === 'EVAL_JUDGE_PROVIDER' ? 'deterministic' : undefined,
    );

    const provider = createEvalJudgeProvider({
      get,
    } as unknown as ConfigService);

    expect(provider.providerName).toBe('deterministic');
    expect(get).toHaveBeenCalledWith('EVAL_JUDGE_PROVIDER');
    expect(get).not.toHaveBeenCalledWith('GROQ_API_KEY');
  });

  it('requires GROQ_API_KEY only when Groq judge mode is explicit', () => {
    const get = jest.fn((key: string) =>
      key === 'EVAL_JUDGE_PROVIDER' ? 'groq' : undefined,
    );
    const getOrThrow = jest.fn(() => {
      throw new Error('GROQ_API_KEY is required.');
    });

    expect(() =>
      createEvalJudgeProvider({
        get,
        getOrThrow,
      } as unknown as ConfigService),
    ).toThrow('GROQ_API_KEY is required.');
    expect(getOrThrow).toHaveBeenCalledWith('GROQ_API_KEY');
  });

  it('fails closed when judge output is invalid JSON', () => {
    expect(parseEvalJudgeResult('not json', 'groq')).toEqual({
      provider: 'groq',
      score: 0,
      passed: false,
      reasoning: 'Judge returned invalid JSON.',
      dimensions: {
        groundedness: false,
        answerCorrectness: false,
        citationSupport: false,
        refusalBehavior: false,
      },
    });
  });
});

function evalCase(): BaselineEvalCase {
  return {
    id: 'eval_supported',
    question: 'How do I export billing history?',
    expectedAnswer: 'Users can export billing history.',
    expectedSources: ['billing'],
    type: 'supported',
  };
}

function evalResult(): Omit<EvalCaseResult, 'judge'> {
  return {
    id: 'eval_supported',
    question: 'How do I export billing history?',
    type: 'supported',
    expectedAnswer: 'Users can export billing history.',
    expectedSources: ['billing'],
    response: {
      status: 'answered',
      question: 'How do I export billing history?',
      answer: 'Users can export billing history from billing settings.',
      citations: [
        {
          chunkId: 'chunk_1',
          documentId: 'doc_1',
          documentTitle: 'Billing',
          sourceKey: 'billing',
          chunkIndex: 0,
          snippet: 'Users can export billing history.',
        },
      ],
      retrievedChunkCount: 1,
    },
    actualConfidence: 0.82,
    score: {
      refusalCorrect: true,
      citationCorrect: true,
      answerMatch: true,
    },
  };
}
