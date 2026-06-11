import type { ChatResponse } from '../chat/chat.types';

export type EvalCaseType = 'supported' | 'unsupported';

export interface BaselineEvalCase {
  id: string;
  question: string;
  expectedAnswer: string;
  expectedSources: string[];
  type: EvalCaseType;
}

export interface EvalScore {
  refusalCorrect: boolean;
  citationCorrect: boolean;
  answerMatch: boolean;
}

export interface EvalJudgeResult {
  provider: string;
  score: number;
  passed: boolean;
  reasoning: string;
  dimensions: {
    groundedness: boolean;
    answerCorrectness: boolean;
    citationSupport: boolean;
    refusalBehavior: boolean;
  };
}

export interface EvalCaseResult {
  id: string;
  question: string;
  type: EvalCaseType;
  expectedAnswer: string;
  expectedSources: string[];
  response: ChatResponse;
  actualConfidence: number;
  score: EvalScore;
  judge?: EvalJudgeResult;
}

export interface EvalAggregateMetrics {
  totalCases: number;
  refusalAccuracy: number;
  citationAccuracy: number;
  answerMatchAccuracy: number;
  overallAccuracy: number;
}

export interface BaselineEvalRunResult {
  evalRunId: string;
  dataset: string;
  judgeProvider: string;
  metrics: EvalAggregateMetrics;
  results: EvalCaseResult[];
}
