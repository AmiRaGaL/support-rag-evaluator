import { Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { IngestionResponseDto } from './dto/ingestion-response.dto';
import { IngestionService } from './ingestion.service';

@ApiTags('ingestion')
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('sample-docs')
  @ApiCreatedResponse({
    description: 'Sample support documents ingested from markdown files.',
    type: IngestionResponseDto,
  })
  ingestSampleDocs() {
    return this.ingestionService.ingestSampleDocs();
  }
}
