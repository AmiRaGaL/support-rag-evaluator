import { Controller, Get } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EmbeddingsService } from './embeddings/embeddings.service';
import { HealthResponseDto } from './health-response.dto';
import { LlmService } from './llm/llm.service';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './auth/public.decorator';

export type RagMode = 'genai' | 'hybrid' | 'deterministic';

export function resolveRagMode(
  llmProvider: string,
  embeddingProvider: string,
): RagMode {
  const deterministicProviderCount = [llmProvider, embeddingProvider].filter(
    (provider) => provider === 'deterministic',
  ).length;

  if (deterministicProviderCount === 0) {
    return 'genai';
  }

  if (deterministicProviderCount === 1) {
    return 'hybrid';
  }

  return 'deterministic';
}

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly embeddingsService: EmbeddingsService,
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
    const llmProvider = this.llmService.getProviderName();
    const embeddingProvider = this.embeddingsService.getProviderName();

    return {
      status: 'ok',
      service: 'support-rag-api',
      database: 'ok',
      llmProvider,
      embeddingProvider,
      ragMode: resolveRagMode(llmProvider, embeddingProvider),
      timestamp: new Date().toISOString(),
    };
  }
}
