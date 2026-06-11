import { ApiProperty } from '@nestjs/swagger';
import { ChatResponseDto } from './chat-response.dto';

export class ChatStreamRetrievedChunkDto {
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
    description: 'Similarity score returned by retrieval.',
    example: 0.82,
  })
  similarity!: number;

  @ApiProperty({
    description: 'Whether the final answer cited this retrieved chunk.',
    example: true,
  })
  citationUsed!: boolean;
}

export class ChatStreamCompleteEventDto {
  @ApiProperty({
    description: 'Server-sent event type.',
    enum: ['complete'],
    example: 'complete',
  })
  type!: 'complete';

  @ApiProperty({
    description: 'Final chat response. This matches the non-streaming shape.',
    type: ChatResponseDto,
  })
  response!: ChatResponseDto;

  @ApiProperty({
    description: 'Final confidence score recorded for the query.',
    example: 0.7,
  })
  confidence!: number;

  @ApiProperty({
    description: 'Retrieved chunks used to generate and inspect the response.',
    type: [ChatStreamRetrievedChunkDto],
  })
  retrievedChunks!: ChatStreamRetrievedChunkDto[];
}
