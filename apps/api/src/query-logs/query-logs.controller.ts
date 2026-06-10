import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IdParamDto } from '../common/dto/id-param.dto';
import { DEFAULT_LIST_LIMIT, ListQueryDto } from '../common/dto/list-query.dto';
import {
  QueryLogsService,
  type QueryLogWithRetrievedChunks,
} from './query-logs.service';
import { QueryLogResponseDto } from './dto/query-log-response.dto';

@ApiTags('query logs')
@Controller('query-logs')
export class QueryLogsController {
  constructor(private readonly queryLogsService: QueryLogsService) {}

  @Get()
  @ApiOkResponse({
    description: 'Recent RAG query logs ordered newest first.',
    type: [QueryLogResponseDto],
  })
  async listQueryLogs(@Query() query: ListQueryDto) {
    const logs = await this.queryLogsService.listRecentRagQueryLogs(
      query.limit ?? DEFAULT_LIST_LIMIT,
    );

    return logs.map((log) => this.toResponse(log));
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'RAG query log detail.',
    type: QueryLogResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No query log exists for the supplied id.',
  })
  async getQueryLog(@Param() params: IdParamDto) {
    const log = await this.queryLogsService.findRagQueryLogById(params.id);

    if (!log) {
      throw new NotFoundException(`Query log ${params.id} was not found.`);
    }

    return this.toResponse(log);
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
