import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { ChatController } from '../chat/chat.controller';
import { ChatService } from '../chat/chat.service';
import { EvalsController } from '../evals/evals.controller';
import { EvalsService } from '../evals/evals.service';
import { HealthController } from '../health.controller';
import { IngestionController } from '../ingestion/ingestion.controller';
import { IngestionService } from '../ingestion/ingestion.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueryLogsController } from '../query-logs/query-logs.controller';
import { QueryLogsService } from '../query-logs/query-logs.service';
import { RetrievalController } from '../retrieval/retrieval.controller';
import { RetrievalService } from '../retrieval/retrieval.service';
import { OPENAPI_TITLE, setupSwagger } from './swagger';

describe('OpenAPI documentation', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        HealthController,
        IngestionController,
        RetrievalController,
        ChatController,
        QueryLogsController,
        EvalsController,
      ],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
        {
          provide: IngestionService,
          useValue: {
            ingestSampleDocs: jest.fn(),
          },
        },
        {
          provide: RetrievalService,
          useValue: {
            embedMissingChunks: jest.fn(),
            searchChunks: jest.fn(),
          },
        },
        {
          provide: ChatService,
          useValue: {
            answerQuestion: jest.fn(),
          },
        },
        {
          provide: QueryLogsService,
          useValue: {
            listRecentRagQueryLogs: jest.fn(),
            findRagQueryLogById: jest.fn(),
          },
        },
        {
          provide: EvalsService,
          useValue: {
            listRecentEvalRuns: jest.fn(),
            findEvalRunById: jest.fn(),
            runBaseline: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
  });

  afterEach(async () => {
    await app.close();
  });

  it('bootstraps with Swagger UI enabled at /docs', async () => {
    const getSpy = jest.spyOn(app.getHttpAdapter(), 'get');

    const document = setupSwagger(app);
    await app.init();

    expect(document.openapi).toBe('3.0.0');
    expect(getSpy).toHaveBeenCalledWith('/docs', expect.any(Function));
  });

  it('includes the API title in the OpenAPI document', () => {
    const document = setupSwagger(app);

    expect(document.info.title).toBe(OPENAPI_TITLE);
  });

  it('documents optional bearer authentication', () => {
    const document = setupSwagger(app);

    expect(document.components?.securitySchemes).toHaveProperty('bearer');
  });

  it('includes important API paths in the OpenAPI document', () => {
    const document = setupSwagger(app);

    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        '/chat',
        '/retrieval/search',
        '/ingestion/sample-docs',
        '/evals/run-baseline',
        '/query-logs',
        '/health',
      ]),
    );
  });
});
