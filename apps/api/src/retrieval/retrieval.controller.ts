import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  RetrievalSearchBodyDto,
  RetrievalSearchQueryDto,
} from './dto/retrieval-search.dto';
import {
  EmbedMissingChunksResponseDto,
  RetrievalSearchResponseDto,
} from './dto/retrieval-response.dto';
import { RetrievalService } from './retrieval.service';

@ApiTags('retrieval')
@Controller('retrieval')
export class RetrievalController {
  constructor(private readonly retrievalService: RetrievalService) {}

  @Post('embed-missing')
  @ApiOperation({
    summary: 'Embed chunks missing vectors',
    description:
      'Creates deterministic local embeddings for stored chunks that do not yet have vectors.',
  })
  @ApiCreatedResponse({
    description: 'Embeds stored document chunks that do not have vectors yet.',
    type: EmbedMissingChunksResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Embedding generation or database update failed.',
  })
  embedMissingChunks() {
    return this.retrievalService.embedMissingChunks();
  }

  @Post('search')
  @ApiOperation({
    summary: 'Search support documentation chunks',
    description:
      'Embeds the request query deterministically and returns the closest stored support documentation chunks.',
  })
  @ApiCreatedResponse({
    description: 'Searches embedded support documentation chunks.',
    type: RetrievalSearchResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Embedding generation or vector search failed.',
  })
  postSearch(@Body() body: RetrievalSearchBodyDto) {
    return this.retrievalService.searchChunks({
      query: body.query,
      limit: body.limit,
    });
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search support documentation chunks',
    description:
      'Embeds the query string deterministically and returns the closest stored support documentation chunks.',
  })
  @ApiOkResponse({
    description: 'Searches embedded support documentation chunks.',
    type: RetrievalSearchResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The query parameters failed validation.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Embedding generation or vector search failed.',
  })
  getSearch(@Query() query: RetrievalSearchQueryDto) {
    return this.retrievalService.searchChunks({
      query: query.q,
      limit: query.limit,
    });
  }
}
