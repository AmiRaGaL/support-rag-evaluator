import { HealthController } from './health.controller';
import { PrismaService } from './prisma/prisma.service';

describe('HealthController', () => {
  it('checks the database and returns a simple health response', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;
    const controller = new HealthController(prisma);

    const result = await controller.getHealth();

    expect(prisma.$queryRaw).toHaveBeenCalledWith(
      expect.arrayContaining(['SELECT 1']),
    );
    expect(result).toEqual({
      status: 'ok',
      service: 'support-rag-api',
      database: 'ok',
      timestamp: expect.any(String),
    });
  });
});
