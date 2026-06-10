import { mkdirSync, mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { ChatService } from '../chat/chat.service';
import { IngestionService } from '../ingestion/ingestion.service';
import { LlmService } from '../llm/llm.service';
import { PrismaService } from '../prisma/prisma.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import type { BaselineEvalCase } from './eval.types';
import {
  EvalsService,
  parseBaselineEvalCases,
  resolveBaselineEvalDatasetPath,
} from './evals.service';

interface EvalRunCreateInput {
  data: {
    name: string;
    datasetPath: string;
    totalCases: number;
    passedCases: number;
    failedCases: number;
    refusalAccuracy: number;
    citationAccuracy: number;
    answerMatchAccuracy: number;
    provider: string;
    caseResults: {
      create: unknown[];
    };
  };
  select: {
    id: boolean;
  };
}

describe('EvalsService', () => {
  it('persists a baseline eval run and returns the saved run id', async () => {
    const evalCases: BaselineEvalCase[] = [
      {
        id: 'eval_supported',
        question: 'How do I export billing history?',
        expectedAnswer: 'Users can export billing history from billing.',
        expectedSources: ['billing'],
        type: 'supported',
      },
      {
        id: 'eval_unsupported',
        question: 'Can I use the product as a toaster?',
        expectedAnswer: 'The assistant should refuse unsupported questions.',
        expectedSources: [],
        type: 'unsupported',
      },
    ];
    const ingestionService = {
      ingestSampleDocs: jest.fn().mockResolvedValue(undefined),
    };
    const retrievalService = {
      embedMissingChunks: jest.fn().mockResolvedValue(undefined),
    };
    const chatService = {
      answerQuestionWithMetadata: jest
        .fn()
        .mockResolvedValueOnce({
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
                snippet: 'Users can export billing history from billing.',
              },
            ],
            retrievedChunkCount: 1,
          },
          confidence: 0.82,
        })
        .mockResolvedValueOnce({
          response: {
            status: 'refused',
            question: 'Can I use the product as a toaster?',
            answer:
              'I could not find support documentation that answers this question.',
            citations: [],
            refusalReason: 'unsupported_by_retrieved_chunks',
            retrievedChunkCount: 1,
          },
          confidence: 0.15,
        }),
    };
    const tx = {
      evalRun: {
        create: jest
          .fn<Promise<{ id: string }>, [EvalRunCreateInput]>()
          .mockResolvedValue({ id: 'eval_run_1' }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (txArg: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const llmService = {
      getProviderName: jest.fn().mockReturnValue('deterministic'),
    };
    const service = new EvalsService(
      ingestionService as unknown as IngestionService,
      retrievalService as unknown as RetrievalService,
      chatService as unknown as ChatService,
      prisma as unknown as PrismaService,
      llmService as unknown as LlmService,
    );

    jest
      .spyOn(
        service as unknown as {
          readBaselineCases: (
            datasetPath: string,
          ) => Promise<BaselineEvalCase[]>;
        },
        'readBaselineCases',
      )
      .mockResolvedValue(evalCases);

    const result = await service.runBaseline();

    expect(result.evalRunId).toBe('eval_run_1');
    expect(result.metrics).toEqual({
      totalCases: 2,
      refusalAccuracy: 1,
      citationAccuracy: 1,
      answerMatchAccuracy: 1,
      overallAccuracy: 1,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const createInput = tx.evalRun.create.mock.calls[0]?.[0];

    if (!createInput) {
      throw new Error('Expected EvalRun create input.');
    }

    expect(createInput.select).toEqual({
      id: true,
    });
    expect(createInput.data).toMatchObject({
      name: 'baseline',
      datasetPath: result.dataset,
      totalCases: 2,
      passedCases: 2,
      failedCases: 0,
      refusalAccuracy: 1,
      citationAccuracy: 1,
      answerMatchAccuracy: 1,
      provider: 'deterministic',
    });
    expect(createInput.data.caseResults.create).toHaveLength(2);
    expect(createInput.data.caseResults.create[0]).toMatchObject({
      caseId: 'eval_supported',
      question: 'How do I export billing history?',
      type: 'supported',
      passed: true,
      expectedAnswer: 'Users can export billing history from billing.',
      expectedSources: ['billing'],
      actualAnswer: 'Users can export billing history from billing settings.',
      actualRefusal: false,
      actualConfidence: 0.82,
      actualCitations: [
        expect.objectContaining({
          chunkId: 'chunk_1',
          sourceKey: 'billing',
        }),
      ],
      refusalCorrect: true,
      citationCorrect: true,
      answerMatch: true,
    });
    expect(createInput.data.caseResults.create[1]).toMatchObject({
      caseId: 'eval_unsupported',
      type: 'unsupported',
      passed: true,
      expectedSources: [],
      actualRefusal: true,
      actualConfidence: 0.15,
      actualCitations: [],
      refusalCorrect: true,
      citationCorrect: true,
      answerMatch: true,
    });
    expect(tx.evalRun.create).toHaveBeenCalledWith({
      data: createInput.data,
      select: {
        id: true,
      },
    });
    expect(llmService.getProviderName).toHaveBeenCalledTimes(1);
  });
});

describe('eval dataset utilities', () => {
  describe('resolveBaselineEvalDatasetPath', () => {
    it('finds the repo-root baseline dataset from a nested dist directory', () => {
      const repoRoot = mkdtempSync(path.join(tmpdir(), 'eval-runner-'));
      const datasetDir = path.join(repoRoot, 'datasets', 'evals');
      const baseDir = path.join(repoRoot, 'apps', 'api', 'dist', 'evals');
      const cwd = path.join(repoRoot, 'apps', 'api');
      const datasetPath = path.join(datasetDir, 'baseline.json');

      mkdirSync(datasetDir, { recursive: true });
      mkdirSync(baseDir, { recursive: true });
      mkdirSync(cwd, { recursive: true });
      writeFileSync(datasetPath, '[]');

      expect(resolveBaselineEvalDatasetPath(baseDir, cwd)).toBe(datasetPath);
    });

    it('falls back to the cwd-relative dataset path when no candidate exists', () => {
      const repoRoot = mkdtempSync(path.join(tmpdir(), 'eval-runner-'));
      const cwd = path.join(repoRoot, 'apps', 'api');

      mkdirSync(cwd, { recursive: true });

      expect(resolveBaselineEvalDatasetPath('/missing/base', cwd)).toBe(
        path.join(cwd, 'datasets', 'evals', 'baseline.json'),
      );
    });
  });

  describe('parseBaselineEvalCases', () => {
    it('normalizes valid cases by trimming string fields and sources', () => {
      expect(
        parseBaselineEvalCases([
          {
            id: ' eval_001 ',
            question: ' How do I reset my password? ',
            expectedAnswer: ' Reset passwords in account security settings. ',
            expectedSources: [' account-management '],
            type: 'supported',
          },
        ]),
      ).toEqual([
        {
          id: 'eval_001',
          question: 'How do I reset my password?',
          expectedAnswer: 'Reset passwords in account security settings.',
          expectedSources: ['account-management'],
          type: 'supported',
        },
      ]);
    });

    it('rejects a non-array dataset', () => {
      expect(() => parseBaselineEvalCases({})).toThrow(
        'Dataset must be an array.',
      );
    });

    it('rejects duplicate ids', () => {
      expect(() =>
        parseBaselineEvalCases([
          validCase({ id: 'eval_001' }),
          validCase({ id: 'eval_001' }),
        ]),
      ).toThrow('duplicate id "eval_001"');
    });

    it('rejects supported cases without expected sources', () => {
      expect(() =>
        parseBaselineEvalCases([validCase({ expectedSources: [] })]),
      ).toThrow('must include at least one expected source');
    });

    it('rejects unsupported cases with expected sources', () => {
      expect(() =>
        parseBaselineEvalCases([
          validCase({
            expectedSources: ['billing'],
            type: 'unsupported',
          }),
        ]),
      ).toThrow('must not include expected sources');
    });

    it('rejects malformed source entries with a clear field path', () => {
      expect(() =>
        parseBaselineEvalCases([
          validCase({
            expectedSources: ['billing', ''],
          }),
        ]),
      ).toThrow('expectedSources[1] must be a non-empty string');
    });
  });
});

function validCase(overrides: Record<string, unknown> = {}) {
  return {
    id: 'eval_001',
    question: 'Can I export billing history?',
    expectedAnswer: 'Users can export billing history.',
    expectedSources: ['billing'],
    type: 'supported',
    ...overrides,
  };
}
