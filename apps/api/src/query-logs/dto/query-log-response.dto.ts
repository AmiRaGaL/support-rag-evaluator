import { ApiProperty } from '@nestjs/swagger';

export class QueryLogRetrievedChunkResponseDto {
  @ApiProperty({
    description: 'Retrieved chunk identifier.',
    example: 'chunk_01J8Z8N4Q7R2V3T9M6K1H5D2A0',
  })
  chunkId!: string;

  @ApiProperty({
    description: 'Document containing the retrieved chunk.',
    example: 'doc_01J8Z8MZK3PX9N8Q4E7V6C2B1A',
  })
  documentId!: string;

  @ApiProperty({
    description: 'Human-readable source document title.',
    example: 'Billing and invoices',
  })
  documentTitle!: string;

  @ApiProperty({
    description: 'Stable source key for the document.',
    example: 'billing',
  })
  sourceKey!: string;

  @ApiProperty({
    description: 'Zero-based chunk index within the document.',
    example: 2,
  })
  chunkIndex!: number;

  @ApiProperty({
    description: 'Similarity score recorded for the retrieved chunk.',
    example: 0.82,
  })
  similarity!: number;

  @ApiProperty({
    description: 'Whether the final answer cited this retrieved chunk.',
    example: true,
  })
  citationUsed!: boolean;
}

export class QueryLogResponseDto {
  @ApiProperty({
    description: 'Persisted query log identifier.',
    example: 'query_01J8Z9Y7KQV2B6G6N0S9W3D4E5',
  })
  id!: string;

  @ApiProperty({
    description: 'Question submitted by the caller.',
    example: 'How do I update the billing email for my workspace?',
  })
  question!: string;

  @ApiProperty({
    description: 'Answer or refusal message returned by the assistant.',
    example:
      'Workspace owners can update the billing email from Settings > Billing.',
  })
  answer!: string;

  @ApiProperty({
    description: 'Whether the assistant refused the question.',
    example: false,
  })
  refusal!: boolean;

  @ApiProperty({
    description: 'Answer confidence recorded with the query.',
    nullable: true,
    example: 0.86,
  })
  confidence!: number | null;

  @ApiProperty({
    description: 'LLM provider used for the response.',
    example: 'deterministic',
  })
  provider!: string;

  @ApiProperty({
    description: 'Number of chunks retrieved for the query.',
    example: 5,
  })
  retrievedChunkCount!: number;

  @ApiProperty({
    description: 'End-to-end query latency in milliseconds.',
    example: 37,
  })
  latencyMs!: number;

  @ApiProperty({
    description: 'Query creation timestamp.',
    format: 'date-time',
    example: '2026-06-10T14:30:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Retrieved chunks recorded for the query.',
    type: [QueryLogRetrievedChunkResponseDto],
  })
  retrievedChunks!: QueryLogRetrievedChunkResponseDto[];
}
