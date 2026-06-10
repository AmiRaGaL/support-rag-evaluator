import { Controller, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IngestionResponseDto } from './dto/ingestion-response.dto';
import { IngestionService } from './ingestion.service';

@ApiTags('ingestion')
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('sample-docs')
  @ApiOperation({
    summary: 'Ingest bundled sample support documents',
    description:
      'Loads markdown sample docs, chunks them, and stores them for retrieval. No external services or LLM provider are required.',
  })
  @ApiCreatedResponse({
    description: 'Sample support documents ingested from markdown files.',
    type: IngestionResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description:
      'The sample docs directory or a sample markdown file could not be read.',
  })
  ingestSampleDocs() {
    return this.ingestionService.ingestSampleDocs();
  }
}
