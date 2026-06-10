import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ChatService } from '../chat/chat.service';
import { IngestionService } from '../ingestion/ingestion.service';
import { LlmService } from '../llm/llm.service';
import { PrismaService } from '../prisma/prisma.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import { scoreEvalCase } from './eval-scorer';
import type {
  BaselineEvalCase,
  BaselineEvalRunResult,
  EvalAggregateMetrics,
  EvalCaseResult,
} from './eval.types';

export type PersistedEvalRunWithCaseResults = Prisma.EvalRunGetPayload<{
  include: {
    caseResults: {
      orderBy: {
        createdAt: 'asc';
      };
    };
  };
}>;

const BASELINE_EVAL_DATASET_RELATIVE_PATH = path.join(
  'datasets',
  'evals',
  'baseline.json',
);

@Injectable()
export class EvalsService {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly retrievalService: RetrievalService,
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
  ) {}

  async runBaseline(): Promise<BaselineEvalRunResult> {
    const datasetPath = resolveBaselineEvalDatasetPath();
    const evalCases = await this.readBaselineCases(datasetPath);

    await this.ingestionService.ingestSampleDocs();
    await this.retrievalService.embedMissingChunks();

    const results: EvalCaseResult[] = [];

    for (const evalCase of evalCases) {
      const result = await this.chatService.answerQuestionWithMetadata({
        question: evalCase.question,
      });
      const response = result.response;
      const score = scoreEvalCase(evalCase, response);

      results.push({
        id: evalCase.id,
        question: evalCase.question,
        type: evalCase.type,
        expectedAnswer: evalCase.expectedAnswer,
        expectedSources: evalCase.expectedSources,
        response,
        actualConfidence: result.confidence,
        score,
      });
    }

    const metrics = this.calculateMetrics(results);
    const evalRun = await this.persistEvalRun({
      datasetPath,
      metrics,
      results,
    });

    return {
      evalRunId: evalRun.id,
      dataset: datasetPath,
      metrics,
      results,
    };
  }

  async listRecentEvalRuns(
    limit: number,
  ): Promise<PersistedEvalRunWithCaseResults[]> {
    return this.prisma.evalRun.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        caseResults: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async findEvalRunById(
    id: string,
  ): Promise<PersistedEvalRunWithCaseResults | null> {
    return this.prisma.evalRun.findUnique({
      where: {
        id,
      },
      include: {
        caseResults: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async readBaselineCases(datasetPath: string): Promise<BaselineEvalCase[]> {
    return readBaselineEvalCases(datasetPath);
  }

  private async persistEvalRun(input: {
    datasetPath: string;
    metrics: EvalAggregateMetrics;
    results: EvalCaseResult[];
  }): Promise<{ id: string }> {
    const passedCases = input.results.filter((result) =>
      this.isCasePassed(result),
    ).length;
    const failedCases = input.results.length - passedCases;
    const provider = this.llmService.getProviderName();

    return this.prisma.$transaction(async (tx) =>
      tx.evalRun.create({
        data: {
          name: 'baseline',
          datasetPath: input.datasetPath,
          totalCases: input.metrics.totalCases,
          passedCases,
          failedCases,
          refusalAccuracy: input.metrics.refusalAccuracy,
          citationAccuracy: input.metrics.citationAccuracy,
          answerMatchAccuracy: input.metrics.answerMatchAccuracy,
          provider,
          caseResults: {
            create: input.results.map((result) => ({
              caseId: result.id,
              question: result.question,
              type: result.type,
              passed: this.isCasePassed(result),
              expectedAnswer: result.expectedAnswer,
              expectedSources: result.expectedSources,
              actualAnswer: result.response.answer,
              actualRefusal: result.response.status === 'refused',
              actualConfidence: result.actualConfidence,
              actualCitations: result.response
                .citations as Prisma.InputJsonValue,
              refusalCorrect: result.score.refusalCorrect,
              citationCorrect: result.score.citationCorrect,
              answerMatch: result.score.answerMatch,
            })),
          },
        },
        select: {
          id: true,
        },
      }),
    );
  }

  private isCasePassed(result: EvalCaseResult): boolean {
    return (
      result.score.refusalCorrect &&
      result.score.citationCorrect &&
      result.score.answerMatch
    );
  }

  private calculateMetrics(results: EvalCaseResult[]): EvalAggregateMetrics {
    const totalCases = results.length;

    if (totalCases === 0) {
      return {
        totalCases,
        refusalAccuracy: 0,
        citationAccuracy: 0,
        answerMatchAccuracy: 0,
        overallAccuracy: 0,
      };
    }

    const refusalCorrectCount = results.filter(
      (result) => result.score.refusalCorrect,
    ).length;
    const citationCorrectCount = results.filter(
      (result) => result.score.citationCorrect,
    ).length;
    const answerMatchCount = results.filter(
      (result) => result.score.answerMatch,
    ).length;
    const fullyCorrectCount = results.filter(
      (result) =>
        result.score.refusalCorrect &&
        result.score.citationCorrect &&
        result.score.answerMatch,
    ).length;

    return {
      totalCases,
      refusalAccuracy: refusalCorrectCount / totalCases,
      citationAccuracy: citationCorrectCount / totalCases,
      answerMatchAccuracy: answerMatchCount / totalCases,
      overallAccuracy: fullyCorrectCount / totalCases,
    };
  }
}

export async function readBaselineEvalCases(
  datasetPath: string,
): Promise<BaselineEvalCase[]> {
  let content: string;

  try {
    content = await fs.readFile(datasetPath, 'utf8');
  } catch (error: unknown) {
    const errorCode = isFileSystemError(error) ? ` (${error.code})` : '';

    throw new InternalServerErrorException(
      `Baseline eval dataset is missing or unreadable at ${datasetPath}${errorCode}.`,
    );
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(content) as unknown;
  } catch {
    throw new InternalServerErrorException(
      `Baseline eval dataset contains malformed JSON at ${datasetPath}.`,
    );
  }

  return parseBaselineEvalCases(parsedJson);
}

export function resolveBaselineEvalDatasetPath(
  baseDir = __dirname,
  currentWorkingDirectory = process.cwd(),
): string {
  const candidates = uniquePaths([
    ...ancestorDatasetCandidates(baseDir),
    ...ancestorDatasetCandidates(currentWorkingDirectory),
  ]);

  return (
    candidates.find((candidate) => existsSync(candidate)) ??
    path.resolve(currentWorkingDirectory, BASELINE_EVAL_DATASET_RELATIVE_PATH)
  );
}

export function parseBaselineEvalCases(value: unknown): BaselineEvalCase[] {
  if (!Array.isArray(value)) {
    throw invalidDatasetError('Dataset must be an array.');
  }

  if (value.length === 0) {
    throw invalidDatasetError('Dataset must include at least one eval case.');
  }

  const seenIds = new Set<string>();

  return value.map((entry, index) => {
    const evalCase = parseEvalCase(entry, index);

    if (seenIds.has(evalCase.id)) {
      throw invalidDatasetError(
        `Case at index ${index} has duplicate id "${evalCase.id}".`,
      );
    }

    seenIds.add(evalCase.id);
    return evalCase;
  });
}

function parseEvalCase(value: unknown, index: number): BaselineEvalCase {
  if (!isRecord(value)) {
    throw invalidDatasetError(`Case at index ${index} must be an object.`);
  }

  const id = parseRequiredString(value.id, index, 'id');
  const question = parseRequiredString(value.question, index, 'question');
  const expectedAnswer = parseRequiredString(
    value.expectedAnswer,
    index,
    'expectedAnswer',
  );
  const expectedSources = parseExpectedSources(value.expectedSources, index);
  const type = parseEvalCaseType(value.type, index);

  if (type === 'supported' && expectedSources.length === 0) {
    throw invalidDatasetError(
      `Case "${id}" is supported and must include at least one expected source.`,
    );
  }

  if (type === 'unsupported' && expectedSources.length > 0) {
    throw invalidDatasetError(
      `Case "${id}" is unsupported and must not include expected sources.`,
    );
  }

  return {
    id,
    question,
    expectedAnswer,
    expectedSources,
    type,
  };
}

function parseRequiredString(
  value: unknown,
  index: number,
  fieldName: string,
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw invalidDatasetError(
      `Case at index ${index} field "${fieldName}" must be a non-empty string.`,
    );
  }

  return value.trim();
}

function parseExpectedSources(value: unknown, index: number): string[] {
  if (!Array.isArray(value)) {
    throw invalidDatasetError(
      `Case at index ${index} field "expectedSources" must be an array.`,
    );
  }

  const sources = value.map((source, sourceIndex) => {
    if (typeof source !== 'string' || source.trim().length === 0) {
      throw invalidDatasetError(
        `Case at index ${index} expectedSources[${sourceIndex}] must be a non-empty string.`,
      );
    }

    return source.trim();
  });

  const uniqueSources = new Set(sources);

  if (uniqueSources.size !== sources.length) {
    throw invalidDatasetError(
      `Case at index ${index} field "expectedSources" must not contain duplicates.`,
    );
  }

  return sources;
}

function parseEvalCaseType(
  value: unknown,
  index: number,
): BaselineEvalCase['type'] {
  if (value !== 'supported' && value !== 'unsupported') {
    throw invalidDatasetError(
      `Case at index ${index} field "type" must be "supported" or "unsupported".`,
    );
  }

  return value;
}

function invalidDatasetError(message: string): InternalServerErrorException {
  return new InternalServerErrorException(
    `Invalid baseline eval dataset: ${message}`,
  );
}

function ancestorDatasetCandidates(startPath: string): string[] {
  const candidates: string[] = [];
  let currentPath = path.resolve(startPath);

  while (true) {
    candidates.push(
      path.join(currentPath, BASELINE_EVAL_DATASET_RELATIVE_PATH),
    );

    const parentPath = path.dirname(currentPath);

    if (parentPath === currentPath) {
      return candidates;
    }

    currentPath = parentPath;
  }
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFileSystemError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
}
