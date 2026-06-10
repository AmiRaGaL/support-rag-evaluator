import { ApiProperty } from '@nestjs/swagger';

export class EmbedMissingChunksResponseDto {
  @ApiProperty({
    description: 'Number of document chunks embedded by this request.',
    example: 26,
  })
  embeddedCount!: number;
}

export class RetrievalChunkResponseDto {
  @ApiProperty({
    description: 'Retrieved chunk identifier.',
    example: 'chunk_01J8Z8N4Q7R2V3T9M6K1H5D2A0',
  })
  id!: string;

  @ApiProperty({
    description: 'Document containing the chunk.',
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
    description: 'Original source path when available.',
    nullable: true,
    example: '/app/datasets/sample-docs/billing.md',
  })
  sourcePath!: string | null;

  @ApiProperty({
    description: 'Zero-based chunk index within the document.',
    example: 2,
  })
  chunkIndex!: number;

  @ApiProperty({
    description: 'Chunk text used for retrieval and grounding.',
    example:
      'Workspace owners can update billing contacts from Settings > Billing.',
  })
  content!: string;

  @ApiProperty({
    description: 'Estimated token count for the chunk when stored.',
    nullable: true,
    example: 42,
  })
  tokenCount!: number | null;

  @ApiProperty({
    description: 'Stored chunk metadata.',
    type: Object,
    nullable: true,
    example: { sourceFileName: 'billing.md' },
  })
  metadata!: unknown;

  @ApiProperty({
    description: 'Vector distance returned by pgvector.',
    example: 0.18,
  })
  distance!: number;

  @ApiProperty({
    description: 'Similarity score derived from vector distance.',
    example: 0.82,
  })
  score!: number;
}

export class RetrievalSearchResponseDto {
  @ApiProperty({
    description: 'Normalized search query.',
    example: 'reset two-factor authentication',
  })
  query!: string;

  @ApiProperty({
    description: 'Effective result limit used for the search.',
    example: 5,
  })
  limit!: number;

  @ApiProperty({
    description: 'Retrieved chunks ordered by best match first.',
    type: [RetrievalChunkResponseDto],
  })
  chunks!: RetrievalChunkResponseDto[];
}
