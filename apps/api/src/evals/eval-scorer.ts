import type { ChatResponse } from '../chat/chat.types';
import type { BaselineEvalCase, EvalScore } from './eval.types';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'can',
  'do',
  'does',
  'for',
  'from',
  'how',
  'i',
  'if',
  'in',
  'is',
  'it',
  'my',
  'of',
  'on',
  'or',
  'our',
  'that',
  'the',
  'their',
  'this',
  'to',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'with',
  'you',
  'your',
]);

const MIN_ANSWER_MATCH_RATIO = 0.5;

export function scoreEvalCase(
  evalCase: BaselineEvalCase,
  response: ChatResponse,
): EvalScore {
  return {
    refusalCorrect: scoreRefusal(evalCase, response),
    citationCorrect: scoreCitations(evalCase, response),
    answerMatch: scoreAnswerMatch(evalCase, response),
  };
}

function scoreRefusal(
  evalCase: BaselineEvalCase,
  response: ChatResponse,
): boolean {
  return evalCase.type === 'unsupported'
    ? response.status === 'refused'
    : response.status === 'answered';
}

function scoreCitations(
  evalCase: BaselineEvalCase,
  response: ChatResponse,
): boolean {
  if (evalCase.type === 'unsupported') {
    return response.citations.length === 0;
  }

  if (response.status !== 'answered' || response.citations.length === 0) {
    return false;
  }

  const expectedSources = new Set(evalCase.expectedSources);
  const citedSources = new Set(
    response.citations.map((citation) => citation.sourceKey),
  );

  return [...expectedSources].every((sourceKey) => citedSources.has(sourceKey));
}

function scoreAnswerMatch(
  evalCase: BaselineEvalCase,
  response: ChatResponse,
): boolean {
  if (evalCase.type === 'unsupported') {
    return response.status === 'refused';
  }

  if (response.status !== 'answered') {
    return false;
  }

  const expectedTerms = extractTerms(evalCase.expectedAnswer);

  if (expectedTerms.size === 0) {
    return response.answer.trim().length > 0;
  }

  const actualTerms = extractTerms(response.answer);
  let matchedTerms = 0;

  for (const term of expectedTerms) {
    if (actualTerms.has(term)) {
      matchedTerms += 1;
    }
  }

  return matchedTerms / expectedTerms.size >= MIN_ANSWER_MATCH_RATIO;
}

function extractTerms(text: string): Set<string> {
  const terms = text
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.map((term) => normalizeTerm(term))
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));

  return new Set(terms ?? []);
}

function normalizeTerm(term: string): string {
  if (term.length > 4 && term.endsWith('ies')) {
    return `${term.slice(0, -3)}y`;
  }

  if (term.length > 3 && term.endsWith('s')) {
    return term.slice(0, -1);
  }

  return term;
}
