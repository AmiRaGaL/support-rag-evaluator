import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  RetrievalSearchBodyDto,
  RetrievalSearchQueryDto,
} from './dto/retrieval-search.dto';
import { RetrievalService } from './retrieval.service';

@Controller('retrieval')
export class RetrievalController {
  constructor(private readonly retrievalService: RetrievalService) {}

  @Post('embed-missing')
  embedMissingChunks() {
    return this.retrievalService.embedMissingChunks();
  }

  @Post('search')
  postSearch(@Body() body: RetrievalSearchBodyDto) {
    return this.retrievalService.searchChunks({
      query: body.query,
      limit: body.limit,
    });
  }

  @Get('search')
  getSearch(@Query() query: RetrievalSearchQueryDto) {
    return this.retrievalService.searchChunks({
      query: query.q,
      limit: query.limit,
    });
  }
}
