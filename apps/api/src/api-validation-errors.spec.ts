import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';
import { ChatRequestDto } from './chat/dto/chat-request.dto';
import { IdParamDto } from './common/dto/id-param.dto';
import { ListQueryDto } from './common/dto/list-query.dto';
import { createApiValidationPipe } from './common/validation/api-validation.pipe';
import { EvalsController } from './evals/evals.controller';
import { EvalsService } from './evals/evals.service';
import { QueryLogsController } from './query-logs/query-logs.controller';
import { QueryLogsService } from './query-logs/query-logs.service';
import {
  RetrievalSearchBodyDto,
  RetrievalSearchQueryDto,
} from './retrieval/dto/retrieval-search.dto';

describe('API validation and error handling', () => {
  describe('POST /chat validation', () => {
    it('returns 400 when question is missing', async () => {
      await expectValidationError(ChatRequestDto, {});
    });

    it('returns 400 when question is empty', async () => {
      await expectValidationError(ChatRequestDto, {
        question: '   ',
      });
    });

    it('returns 400 when question is not a string', async () => {
      await expectValidationError(ChatRequestDto, {
        question: 123,
      });
    });

    it('returns 400 when limit is invalid', async () => {
      await expectValidationError(ChatRequestDto, {
        question: 'How do I update billing?',
        limit: 21,
      });
    });
  });

  describe('retrieval search validation', () => {
    it('returns 400 when POST /retrieval/search query is missing', async () => {
      await expectValidationError(RetrievalSearchBodyDto, {});
    });

    it('returns 400 when POST /retrieval/search limit is invalid', async () => {
      await expectValidationError(RetrievalSearchBodyDto, {
        query: 'billing',
        limit: 0,
      });
    });

    it('returns 400 when GET /retrieval/search q is missing', async () => {
      await expectValidationError(RetrievalSearchQueryDto, {}, 'query');
    });

    it('returns 400 when GET /retrieval/search limit is invalid', async () => {
      await expectValidationError(
        RetrievalSearchQueryDto,
        {
          q: 'billing',
          limit: 'abc',
        },
        'query',
      );
    });
  });

  describe('list limit validation', () => {
    it('returns 400 for invalid list limits', async () => {
      await expectValidationError(
        ListQueryDto,
        {
          limit: 'abc',
        },
        'query',
      );
    });

    it('enforces the max list limit', async () => {
      await expectValidationError(
        ListQueryDto,
        {
          limit: '51',
        },
        'query',
      );
    });

    it('allows the max query log limit', async () => {
      const queryLogsService = {
        listRecentRagQueryLogs: jest.fn().mockResolvedValue([]),
        findRagQueryLogById: jest.fn(),
      };
      const controller = new QueryLogsController(
        queryLogsService as unknown as QueryLogsService,
      );
      const query = await validateRequest(
        ListQueryDto,
        { limit: '50' },
        'query',
      );

      await expect(controller.listQueryLogs(query)).resolves.toEqual([]);

      expect(queryLogsService.listRecentRagQueryLogs).toHaveBeenCalledWith(50);
    });

    it('allows the max eval run limit', async () => {
      const evalsService = {
        listRecentEvalRuns: jest.fn().mockResolvedValue([]),
        findEvalRunById: jest.fn(),
        runBaseline: jest.fn(),
      };
      const controller = new EvalsController(
        evalsService as unknown as EvalsService,
      );
      const query = await validateRequest(
        ListQueryDto,
        { limit: '50' },
        'query',
      );

      await expect(controller.listEvalRuns(query)).resolves.toEqual([]);

      expect(evalsService.listRecentEvalRuns).toHaveBeenCalledWith(50);
    });
  });

  describe('not-found behavior', () => {
    it('returns 404 for a missing query log id', async () => {
      const queryLogsService = {
        listRecentRagQueryLogs: jest.fn(),
        findRagQueryLogById: jest.fn().mockResolvedValue(null),
      };
      const controller = new QueryLogsController(
        queryLogsService as unknown as QueryLogsService,
      );
      const params = await validateRequest(
        IdParamDto,
        {
          id: 'missing_query',
        },
        'param',
      );

      await expect(controller.getQueryLog(params)).rejects.toMatchObject({
        response: {
          statusCode: 404,
          message: 'Query log missing_query was not found.',
          error: 'Not Found',
        },
      });
      await expect(controller.getQueryLog(params)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns 404 for a missing eval run id', async () => {
      const evalsService = {
        listRecentEvalRuns: jest.fn(),
        findEvalRunById: jest.fn().mockResolvedValue(null),
        runBaseline: jest.fn(),
      };
      const controller = new EvalsController(
        evalsService as unknown as EvalsService,
      );
      const params = await validateRequest(
        IdParamDto,
        {
          id: 'missing_eval',
        },
        'param',
      );

      await expect(controller.getEvalRun(params)).rejects.toMatchObject({
        response: {
          statusCode: 404,
          message: 'Eval run missing_eval was not found.',
          error: 'Not Found',
        },
      });
      await expect(controller.getEvalRun(params)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

async function expectValidationError(
  metatype: new () => object,
  value: Record<string, unknown>,
  type: ArgumentMetadata['type'] = 'body',
): Promise<void> {
  try {
    await validateRequest(metatype, value, type);
    throw new Error('Expected request validation to fail.');
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(BadRequestException);

    const response = (error as BadRequestException).getResponse();

    expect(isRecord(response)).toBe(true);
    expect((error as BadRequestException).getStatus()).toBe(400);

    const body = response as {
      message?: unknown;
      errors?: unknown;
    };

    expect(body.message).toBe('Request validation failed');
    expect(Array.isArray(body.errors)).toBe(true);
    expect((body.errors as unknown[]).length).toBeGreaterThan(0);
  }
}

async function validateRequest<T extends object>(
  metatype: new () => T,
  value: Record<string, unknown>,
  type: ArgumentMetadata['type'] = 'body',
): Promise<T> {
  const pipe = createApiValidationPipe();

  return (await pipe.transform(value, {
    type,
    metatype,
    data: '',
  })) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
