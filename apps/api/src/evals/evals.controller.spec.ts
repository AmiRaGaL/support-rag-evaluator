import { NotFoundException } from '@nestjs/common';
import { EvalsController } from './evals.controller';
import { EvalsService } from './evals.service';

describe('EvalsController', () => {
  const evalsService = {
    listRecentEvalRuns: jest.fn(),
    findEvalRunById: jest.fn(),
    runBaseline: jest.fn(),
  };

  beforeEach(() => {
    evalsService.listRecentEvalRuns.mockReset();
    evalsService.findEvalRunById.mockReset();
    evalsService.runBaseline.mockReset();
  });

  it('returns recent eval runs with a validated limit', async () => {
    const createdAt = new Date('2026-06-10T00:00:00.000Z');
    evalsService.listRecentEvalRuns.mockResolvedValue([
      persistedRun({ createdAt }),
    ]);
    const controller = new EvalsController(
      evalsService as unknown as EvalsService,
    );

    await expect(controller.listEvalRuns({ limit: 50 })).resolves.toEqual([
      {
        id: 'eval_run_1',
        name: 'baseline',
        datasetPath: '/repo/datasets/evals/baseline.json',
        totalCases: 1,
        passedCases: 1,
        failedCases: 0,
        refusalAccuracy: 1,
        citationAccuracy: 1,
        answerMatchAccuracy: 1,
        provider: 'deterministic',
        judgeProvider: 'deterministic',
        createdAt,
        results: [
          {
            caseId: 'eval_001',
            question: 'How do I export billing history?',
            type: 'supported',
            passed: true,
            expectedAnswer: 'Users can export billing history.',
            expectedSources: ['billing'],
            actualAnswer: 'Use billing settings.',
            actualRefusal: false,
            actualConfidence: 0.82,
            actualCitations: [
              {
                chunkId: 'chunk_1',
                sourceKey: 'billing',
              },
            ],
            refusalCorrect: true,
            citationCorrect: true,
            answerMatch: true,
            judgeProvider: 'deterministic',
            judgeScore: 1,
            judgePassed: true,
            judgeReasoning:
              'Deterministic judge mirrored the baseline scoring dimensions.',
            judgeResult: deterministicJudgeResult(),
          },
        ],
      },
    ]);
    expect(evalsService.listRecentEvalRuns).toHaveBeenCalledWith(50);
  });

  it('uses the default limit when no limit query value is provided', async () => {
    evalsService.listRecentEvalRuns.mockResolvedValue([]);
    const controller = new EvalsController(
      evalsService as unknown as EvalsService,
    );

    await expect(controller.listEvalRuns({})).resolves.toEqual([]);

    expect(evalsService.listRecentEvalRuns).toHaveBeenCalledWith(20);
  });

  it('passes validated list limits through', async () => {
    evalsService.listRecentEvalRuns.mockResolvedValue([]);
    const controller = new EvalsController(
      evalsService as unknown as EvalsService,
    );

    await expect(controller.listEvalRuns({ limit: 1 })).resolves.toEqual([]);

    expect(evalsService.listRecentEvalRuns).toHaveBeenCalledWith(1);
  });

  it('returns one eval run by id', async () => {
    const createdAt = new Date('2026-06-10T00:00:00.000Z');
    evalsService.findEvalRunById.mockResolvedValue(persistedRun({ createdAt }));
    const controller = new EvalsController(
      evalsService as unknown as EvalsService,
    );

    await expect(
      controller.getEvalRun({ id: 'eval_run_1' }),
    ).resolves.toMatchObject({
      id: 'eval_run_1',
      name: 'baseline',
      datasetPath: '/repo/datasets/evals/baseline.json',
      provider: 'deterministic',
      judgeProvider: 'deterministic',
      createdAt,
      results: [
        {
          caseId: 'eval_001',
          actualConfidence: 0.82,
        },
      ],
    });
    expect(evalsService.findEvalRunById).toHaveBeenCalledWith('eval_run_1');
  });

  it('throws NotFoundException when an eval run does not exist', async () => {
    evalsService.findEvalRunById.mockResolvedValue(null);
    const controller = new EvalsController(
      evalsService as unknown as EvalsService,
    );

    await expect(
      controller.getEvalRun({ id: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the persisted eval run id from baseline runs', async () => {
    evalsService.runBaseline.mockResolvedValue({
      evalRunId: 'eval_run_1',
      dataset: '/repo/datasets/evals/baseline.json',
      judgeProvider: 'deterministic',
      metrics: {
        totalCases: 0,
        refusalAccuracy: 0,
        citationAccuracy: 0,
        answerMatchAccuracy: 0,
        overallAccuracy: 0,
      },
      results: [],
    });
    const controller = new EvalsController(
      evalsService as unknown as EvalsService,
    );

    await expect(controller.runBaseline()).resolves.toMatchObject({
      evalRunId: 'eval_run_1',
    });
    expect(evalsService.runBaseline).toHaveBeenCalledTimes(1);
  });
});

function persistedRun(input: { createdAt: Date }) {
  return {
    id: 'eval_run_1',
    name: 'baseline',
    datasetPath: '/repo/datasets/evals/baseline.json',
    totalCases: 1,
    passedCases: 1,
    failedCases: 0,
    refusalAccuracy: 1,
    citationAccuracy: 1,
    answerMatchAccuracy: 1,
    provider: 'deterministic',
    judgeProvider: 'deterministic',
    createdAt: input.createdAt,
    caseResults: [
      {
        id: 'case_result_1',
        evalRunId: 'eval_run_1',
        caseId: 'eval_001',
        question: 'How do I export billing history?',
        type: 'supported',
        passed: true,
        expectedAnswer: 'Users can export billing history.',
        expectedSources: ['billing'],
        actualAnswer: 'Use billing settings.',
        actualRefusal: false,
        actualConfidence: 0.82,
        actualCitations: [
          {
            chunkId: 'chunk_1',
            sourceKey: 'billing',
          },
        ],
        refusalCorrect: true,
        citationCorrect: true,
        answerMatch: true,
        judgeProvider: 'deterministic',
        judgeScore: 1,
        judgePassed: true,
        judgeReasoning:
          'Deterministic judge mirrored the baseline scoring dimensions.',
        judgeResult: deterministicJudgeResult(),
        createdAt: input.createdAt,
      },
    ],
  };
}

function deterministicJudgeResult() {
  return {
    provider: 'deterministic',
    score: 1,
    passed: true,
    reasoning: 'Deterministic judge mirrored the baseline scoring dimensions.',
    dimensions: {
      groundedness: true,
      answerCorrectness: true,
      citationSupport: true,
      refusalBehavior: true,
    },
  };
}
