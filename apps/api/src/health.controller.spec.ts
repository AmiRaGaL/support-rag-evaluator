import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma/prisma.service';

describe('HealthController', () => {
  it('checks the database and returns a simple health response', async () => {
    const queryRaw = jest
      .fn<Promise<Array<Record<string, number>>>, [TemplateStringsArray]>()
      .mockResolvedValue([{ '?column?': 1 }]);
    const prisma = {
      $queryRaw: queryRaw,
    } as unknown as PrismaService;
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') {
          return 'production';
        }

        return undefined;
      }),
    } as unknown as ConfigService;
    const controller = new HealthController(prisma, configService);

    const result: Awaited<ReturnType<HealthController['getHealth']>> =
      await controller.getHealth();

    expect(queryRaw).toHaveBeenCalledWith(expect.arrayContaining(['SELECT 1']));
    expect(result).toEqual({
      status: 'ok',
      service: 'support-rag-api',
      database: 'ok',
      llmProvider: 'groq',
      embeddingProvider: 'openai',
      ragMode: 'genai',
      timestamp: result.timestamp,
    });
    expect(typeof result.timestamp).toBe('string');
  });
});
