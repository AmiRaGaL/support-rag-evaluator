import { Controller, Get } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { resolveEmbeddingProviderName } from './embeddings/embeddings.module';
import { HealthResponseDto } from './health-response.dto';
import { resolveLlmProviderName } from './llm/llm.module';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './auth/public.decorator';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

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
    const llmProvider = resolveLlmProviderName(this.configService);
    const embeddingProvider = resolveEmbeddingProviderName(this.configService);

    return {
      status: 'ok',
      service: 'support-rag-api',
      database: 'ok',
      llmProvider,
      embeddingProvider,
      ragMode:
        llmProvider === 'groq' && embeddingProvider === 'openai'
          ? 'genai'
          : 'deterministic',
      timestamp: new Date().toISOString(),
    };
  }
}
