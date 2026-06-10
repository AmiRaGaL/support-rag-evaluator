import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'List recent RAG query logs',
    description:
      'Returns recent query logs with retrieved chunk metadata. Logs include the provider used; deterministic is the default provider and Groq appears only if configured for the original query.',
  })
  @ApiOkResponse({
    description: 'Recent RAG query logs ordered newest first.',
    type: [QueryLogResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'The query parameters failed validation.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Query log retrieval failed.',
  })
  async listQueryLogs(@Query() query: ListQueryDto) {
    const logs = await this.queryLogsService.listRecentRagQueryLogs(
      query.limit ?? DEFAULT_LIST_LIMIT,
    );

    return logs.map((log) => this.toResponse(log));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a RAG query log',
    description:
      'Returns one query log with retrieved chunk metadata and the provider used for the original answer.',
  })
  @ApiOkResponse({
    description: 'RAG query log detail.',
    type: QueryLogResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The id parameter failed validation.',
  })
  @ApiNotFoundResponse({
    description: 'No query log exists for the supplied id.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Query log retrieval failed.',
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
