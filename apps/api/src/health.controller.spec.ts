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
    const controller = new HealthController(prisma);

    const result: Awaited<ReturnType<HealthController['getHealth']>> =
      await controller.getHealth();

    expect(queryRaw).toHaveBeenCalledWith(expect.arrayContaining(['SELECT 1']));
    expect(result).toEqual({
      status: 'ok',
      service: 'support-rag-api',
      database: 'ok',
      timestamp: result.timestamp,
    });
    expect(typeof result.timestamp).toBe('string');
  });
});
