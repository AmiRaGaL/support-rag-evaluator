import { Controller, Get } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { HealthResponseDto } from './health-response.dto';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './auth/public.decorator';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Check API and database health',
    description:
      'Verifies that the API is running and can reach PostgreSQL. This endpoint does not use an LLM provider.',
  })
  @ApiOkResponse({
    description: 'API and database health status.',
    type: HealthResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'The database health check failed.',
  })
  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      service: 'support-rag-api',
      database: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
