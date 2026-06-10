import type { ChatResponse } from '../chat/chat.types';
import type { BaselineEvalCase } from './eval.types';
import { scoreEvalCase } from './eval-scorer';

describe('scoreEvalCase', () => {
  const supportedCase: BaselineEvalCase = {
    id: 'eval_001',
    question: 'How do I reset my password?',
    expectedAnswer:
      'Users can reset their password from account security settings.',
    expectedSources: ['account-management'],
    type: 'supported',
  };

  const unsupportedCase: BaselineEvalCase = {
    id: 'eval_002',
    question: "What is the CEO's private phone number?",
    expectedAnswer: "I don't know based on the provided support documents.",
    expectedSources: [],
    type: 'unsupported',
  };

  it('scores supported answers with expected citations and answer terms', () => {
    const response: ChatResponse = {
      status: 'answered',
      question: supportedCase.question,
      answer:
        'According to the retrieved support documentation:\n1. Users can reset passwords in account security settings.',
      citations: [
        {
          chunkId: 'chunk_1',
          documentId: 'doc_1',
          documentTitle: 'Account Management',
          sourceKey: 'account-management',
          chunkIndex: 0,
          snippet: 'Users can reset passwords in account security settings.',
        },
      ],
      retrievedChunkCount: 1,
    };

    expect(scoreEvalCase(supportedCase, response)).toEqual({
      refusalCorrect: true,
      citationCorrect: true,
      answerMatch: true,
    });
  });

  it('requires supported cases to be answered', () => {
    const response: ChatResponse = {
      status: 'refused',
      question: supportedCase.question,
      answer:
        'I found related documentation, but it does not contain enough matching support details to answer this question.',
      citations: [],
      refusalReason: 'insufficient_overlap',
      retrievedChunkCount: 1,
    };

    expect(scoreEvalCase(supportedCase, response)).toEqual({
      refusalCorrect: false,
      citationCorrect: false,
      answerMatch: false,
    });
  });

  it('scores unsupported refusals without citations as correct', () => {
    const response: ChatResponse = {
      status: 'refused',
      question: unsupportedCase.question,
      answer:
        'I found related documentation, but it does not contain enough matching support details to answer this question.',
      citations: [],
      refusalReason: 'insufficient_overlap',
      retrievedChunkCount: 3,
    };

    expect(scoreEvalCase(unsupportedCase, response)).toEqual({
      refusalCorrect: true,
      citationCorrect: true,
      answerMatch: true,
    });
  });

  it('flags unsupported answers with citations as incorrect', () => {
    const response: ChatResponse = {
      status: 'answered',
      question: unsupportedCase.question,
      answer: 'The private phone number is in the retrieved document.',
      citations: [
        {
          chunkId: 'chunk_1',
          documentId: 'doc_1',
          documentTitle: 'Account Management',
          sourceKey: 'account-management',
          chunkIndex: 0,
          snippet: 'Account settings can be updated by users.',
        },
      ],
      retrievedChunkCount: 1,
    };

    expect(scoreEvalCase(unsupportedCase, response)).toEqual({
      refusalCorrect: false,
      citationCorrect: false,
      answerMatch: false,
    });
  });

  it('flags answers that do not match enough expected answer terms', () => {
    const response: ChatResponse = {
      status: 'answered',
      question: supportedCase.question,
      answer: 'Billing emails can be updated from billing settings.',
      citations: [
        {
          chunkId: 'chunk_1',
          documentId: 'doc_1',
          documentTitle: 'Account Management',
          sourceKey: 'account-management',
          chunkIndex: 0,
          snippet: 'Users can reset passwords in account security settings.',
        },
      ],
      retrievedChunkCount: 1,
    };

    expect(scoreEvalCase(supportedCase, response)).toEqual({
      refusalCorrect: true,
      citationCorrect: true,
      answerMatch: false,
    });
  });

  it('flags supported answers that miss expected citation sources', () => {
    const response: ChatResponse = {
      status: 'answered',
      question: supportedCase.question,
      answer:
        'According to the retrieved support documentation:\n1. Users can reset passwords in account security settings.',
      citations: [
        {
          chunkId: 'chunk_1',
          documentId: 'doc_1',
          documentTitle: 'Billing',
          sourceKey: 'billing',
          chunkIndex: 0,
          snippet: 'Users can reset passwords in account security settings.',
        },
      ],
      retrievedChunkCount: 1,
    };

    expect(scoreEvalCase(supportedCase, response)).toEqual({
      refusalCorrect: true,
      citationCorrect: false,
      answerMatch: true,
    });
  });
});
