import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiCreatedResponse({
    description: 'Embeds stored document chunks that do not have vectors yet.',
    type: EmbedMissingChunksResponseDto,
  })
  embedMissingChunks() {
    return this.retrievalService.embedMissingChunks();
  }

  @Post('search')
  @ApiCreatedResponse({
    description: 'Searches embedded support documentation chunks.',
    type: RetrievalSearchResponseDto,
  })
  postSearch(@Body() body: RetrievalSearchBodyDto) {
    return this.retrievalService.searchChunks({
      query: body.query,
      limit: body.limit,
    });
  }

  @Get('search')
  @ApiOkResponse({
    description: 'Searches embedded support documentation chunks.',
    type: RetrievalSearchResponseDto,
  })
  getSearch(@Query() query: RetrievalSearchQueryDto) {
    return this.retrievalService.searchChunks({
      query: query.q,
      limit: query.limit,
    });
  }
}
