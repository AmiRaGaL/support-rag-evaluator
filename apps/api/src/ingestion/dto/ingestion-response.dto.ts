import { ApiProperty } from '@nestjs/swagger';

export class IngestedDocumentSummaryDto {
  @ApiProperty({
    description: 'Persisted document identifier.',
    example: 'doc_01J8Z8MZK3PX9N8Q4E7V6C2B1A',
  })
  id!: string;

  @ApiProperty({
    description: 'Document title extracted from the markdown source.',
    example: 'Billing and invoices',
  })
  title!: string;

  @ApiProperty({
    description:
      'Stable source key derived from the sample document file name.',
    example: 'billing',
  })
  sourceKey!: string;

  @ApiProperty({
    description: 'Number of chunks stored for the document.',
    example: 8,
  })
  chunkCount!: number;
}

export class IngestionResponseDto {
  @ApiProperty({
    description: 'Number of sample documents processed.',
    example: 4,
  })
  documentsProcessed!: number;

  @ApiProperty({
    description: 'Total chunks created or replaced during ingestion.',
    example: 26,
  })
  chunksCreated!: number;

  @ApiProperty({
    description: 'Per-document ingestion summary.',
    type: [IngestedDocumentSummaryDto],
  })
  documents!: IngestedDocumentSummaryDto[];
}
