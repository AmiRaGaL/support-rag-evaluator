import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import {
  QueryLogsService,
  type QueryLogWithRetrievedChunks,
} from './query-logs.service';

const DEFAULT_QUERY_LOG_LIMIT = 20;
const MIN_QUERY_LOG_LIMIT = 1;
const MAX_QUERY_LOG_LIMIT = 50;

@Controller('query-logs')
export class QueryLogsController {
  constructor(private readonly queryLogsService: QueryLogsService) {}

  @Get()
  async listQueryLogs(@Query('limit') limit: unknown) {
    const logs = await this.queryLogsService.listRecentRagQueryLogs(
      this.normalizeLimit(limit),
    );

    return logs.map((log) => this.toResponse(log));
  }

  @Get(':id')
  async getQueryLog(@Param('id') id: string) {
    const log = await this.queryLogsService.findRagQueryLogById(id);

    if (!log) {
      throw new NotFoundException(`Query log ${id} was not found.`);
    }

    return this.toResponse(log);
  }

  private normalizeLimit(limit: unknown): number {
    if (typeof limit !== 'string') {
      return DEFAULT_QUERY_LOG_LIMIT;
    }

    const parsed = Number(limit);

    if (!Number.isFinite(parsed)) {
      return DEFAULT_QUERY_LOG_LIMIT;
    }

    return Math.min(
      Math.max(Math.trunc(parsed), MIN_QUERY_LOG_LIMIT),
      MAX_QUERY_LOG_LIMIT,
    );
  }

  private toResponse(log: QueryLogWithRetrievedChunks) {
    return {
      id: log.id,
      question: log.question,
      answer: log.answer,
      refusal: log.refusal,
      confidence: log.confidence,
      provider: log.provider,
      retrievedChunkCount: log.retrievedChunkCount,
      latencyMs: log.latencyMs,
      createdAt: log.createdAt,
      retrievedChunks: log.retrievedChunks.map((chunk) => ({
        chunkId: chunk.chunkId,
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        sourceKey: chunk.sourceKey,
        chunkIndex: chunk.chunkIndex,
        similarity: chunk.similarity,
        citationUsed: chunk.citationUsed,
      })),
    };
  }
}
