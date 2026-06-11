import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  BaselineEvalCase,
  EvalCaseResult,
  EvalJudgeResult,
} from './eval.types';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';

export type EvalJudgeProviderName = 'deterministic' | 'groq';

export interface EvalJudgeProvider {
  readonly providerName: EvalJudgeProviderName;
  judge(input: EvalJudgeInput): Promise<EvalJudgeResult>;
}

export interface EvalJudgeInput {
  evalCase: BaselineEvalCase;
  result: Omit<EvalCaseResult, 'judge'>;
}

export class DeterministicEvalJudgeProvider implements EvalJudgeProvider {
  readonly providerName = 'deterministic' as const;

  judge(input: EvalJudgeInput): Promise<EvalJudgeResult> {
    const dimensions = {
      groundedness: input.result.score.citationCorrect,
      answerCorrectness: input.result.score.answerMatch,
      citationSupport: input.result.score.citationCorrect,
      refusalBehavior: input.result.score.refusalCorrect,
    };
    const passed = Object.values(dimensions).every(Boolean);

    return Promise.resolve({
      provider: this.providerName,
      score: passed ? 1 : 0,
      passed,
      reasoning: passed
        ? 'Deterministic judge mirrored the baseline scoring dimensions.'
        : 'Deterministic judge found at least one failed baseline scoring dimension.',
      dimensions,
    });
  }
}

export class GroqEvalJudgeProvider implements EvalJudgeProvider {
  readonly providerName = 'groq' as const;

  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: { apiKey: string; model?: string; baseURL?: string }) {
    const apiKey = options.apiKey.trim();

    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY is required when EVAL_JUDGE_PROVIDER=groq.',
      );
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: options.baseURL?.trim() || GROQ_BASE_URL,
    });
    this.model = options.model?.trim() || DEFAULT_GROQ_MODEL;
  }

  async judge(input: EvalJudgeInput): Promise<EvalJudgeResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a strict evaluator for a RAG support assistant. Return strict JSON only. Do not include markdown.',
        },
        {
          role: 'user',
          content: buildJudgePrompt(input),
        },
      ],
    });
    const content = completion.choices[0]?.message?.content;

    return parseEvalJudgeResult(content, this.providerName);
  }
}

export function createEvalJudgeProvider(
  configService: ConfigService,
): EvalJudgeProvider {
  const provider = normalizeJudgeProvider(
    configService.get<string>('EVAL_JUDGE_PROVIDER'),
  );

  if (provider === 'groq') {
    return new GroqEvalJudgeProvider({
      apiKey: configService.getOrThrow<string>('GROQ_API_KEY'),
      model: configService.get<string>('GROQ_CHAT_MODEL'),
      baseURL: configService.get<string>('GROQ_BASE_URL'),
    });
  }

  return new DeterministicEvalJudgeProvider();
}

export function normalizeJudgeProvider(
  value: string | undefined,
): EvalJudgeProviderName {
  const normalized = value?.trim().toLowerCase();

  return normalized === 'groq' ? 'groq' : 'deterministic';
}

export function parseEvalJudgeResult(
  content: string | null | undefined,
  provider: EvalJudgeProviderName,
): EvalJudgeResult {
  if (!content) {
    return invalidJudgeResult(provider, 'Judge returned an empty response.');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    return invalidJudgeResult(provider, 'Judge returned invalid JSON.');
  }

  if (!isRecord(parsed) || !isRecord(parsed.dimensions)) {
    return invalidJudgeResult(
      provider,
      'Judge JSON must include score, passed, reasoning, and dimensions.',
    );
  }

  const score = parsed.score;
  const passed = parsed.passed;
  const reasoning = parsed.reasoning;
  const dimensions = parsed.dimensions;

  if (
    typeof score !== 'number' ||
    score < 0 ||
    score > 1 ||
    typeof passed !== 'boolean' ||
    typeof reasoning !== 'string' ||
    typeof dimensions.groundedness !== 'boolean' ||
    typeof dimensions.answerCorrectness !== 'boolean' ||
    typeof dimensions.citationSupport !== 'boolean' ||
    typeof dimensions.refusalBehavior !== 'boolean'
  ) {
    return invalidJudgeResult(
      provider,
      'Judge JSON contained invalid field types or score range.',
    );
  }

  return {
    provider,
    score,
    passed,
    reasoning,
    dimensions: {
      groundedness: dimensions.groundedness,
      answerCorrectness: dimensions.answerCorrectness,
      citationSupport: dimensions.citationSupport,
      refusalBehavior: dimensions.refusalBehavior,
    },
  };
}

function invalidJudgeResult(
  provider: EvalJudgeProviderName,
  reason: string,
): EvalJudgeResult {
  return {
    provider,
    score: 0,
    passed: false,
    reasoning: reason,
    dimensions: {
      groundedness: false,
      answerCorrectness: false,
      citationSupport: false,
      refusalBehavior: false,
    },
  };
}

function buildJudgePrompt(input: EvalJudgeInput): string {
  return JSON.stringify({
    instructions:
      'Grade whether the actual support response is grounded in citations, answers the expected behavior, supports citations, and refuses unsupported questions. Return only JSON with score, passed, reasoning, and dimensions.',
    requiredJsonShape: {
      score: 'number from 0 to 1',
      passed: 'boolean',
      reasoning: 'short string',
      dimensions: {
        groundedness: 'boolean',
        answerCorrectness: 'boolean',
        citationSupport: 'boolean',
        refusalBehavior: 'boolean',
      },
    },
    evalCase: input.evalCase,
    actualResponse: input.result.response,
    deterministicScore: input.result.score,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
