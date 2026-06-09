import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RetrievalService } from './retrieval.service';

interface SearchBody {
  query?: unknown;
  limit?: unknown;
}

@Controller('retrieval')
export class RetrievalController {
  constructor(private readonly retrievalService: RetrievalService) {}

  @Post('embed-missing')
  embedMissingChunks() {
    return this.retrievalService.embedMissingChunks();
  }

  @Post('search')
  postSearch(@Body() body: SearchBody) {
    return this.retrievalService.searchChunks({
      query: this.normalizeQuery(body?.query),
      limit: this.normalizeLimit(body?.limit),
    });
  }

  @Get('search')
  getSearch(@Query('q') query: unknown, @Query('limit') limit: unknown) {
    return this.retrievalService.searchChunks({
      query: this.normalizeQuery(query),
      limit: this.normalizeLimit(limit),
    });
  }

  private normalizeQuery(query: unknown): string {
    return typeof query === 'string' ? query : '';
  }

  private normalizeLimit(limit: unknown): number | undefined {
    if (typeof limit === 'number') {
      return limit;
    }

    if (typeof limit === 'string') {
      const parsed = Number(limit);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }
}
