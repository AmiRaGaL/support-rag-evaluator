import { Controller, Post } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('sample-docs')
  ingestSampleDocs() {
    return this.ingestionService.ingestSampleDocs();
  }
}
