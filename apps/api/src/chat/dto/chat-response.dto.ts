import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatCitationResponseDto {
  @ApiProperty({
    description: 'Retrieved chunk used as support for the answer.',
    example: 'chunk_01J8Z8N4Q7R2V3T9M6K1H5D2A0',
  })
  chunkId!: string;

  @ApiProperty({
    description: 'Document containing the cited chunk.',
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
    description: 'Short cited text excerpt from the retrieved chunk.',
    example:
      'Workspace owners can update the billing email from Settings > Billing.',
  })
  snippet!: string;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'Whether the assistant answered or refused the question.',
    enum: ['answered', 'refused'],
    example: 'answered',
  })
  status!: 'answered' | 'refused';

  @ApiProperty({
    description: 'Normalized question submitted by the caller.',
    example: 'How do I update the billing email for my workspace?',
  })
  question!: string;

  @ApiProperty({
    description: 'Grounded answer or refusal message.',
    example:
      'Workspace owners can update the billing email from Settings > Billing.',
  })
  answer!: string;

  @ApiProperty({
    description:
      'Citations supporting the answer. Refusals return an empty array.',
    type: [ChatCitationResponseDto],
  })
  citations!: ChatCitationResponseDto[];

  @ApiPropertyOptional({
    description: 'Reason the assistant refused to answer.',
    enum: [
      'empty_question',
      'no_retrieved_chunks',
      'insufficient_overlap',
      'invalid_llm_output',
      'unsupported_by_retrieved_chunks',
    ],
    example: 'unsupported_by_retrieved_chunks',
  })
  refusalReason?:
    | 'empty_question'
    | 'no_retrieved_chunks'
    | 'insufficient_overlap'
    | 'invalid_llm_output'
    | 'unsupported_by_retrieved_chunks';

  @ApiProperty({
    description: 'Number of chunks retrieved for the question.',
    example: 5,
  })
  retrievedChunkCount!: number;
}
