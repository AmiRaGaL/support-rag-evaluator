import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    description: 'API health status.',
    example: 'ok',
  })
  status!: string;

  @ApiProperty({
    description: 'Service identifier.',
    example: 'support-rag-api',
  })
  service!: string;

  @ApiProperty({
    description: 'Database connectivity status.',
    example: 'ok',
  })
  database!: string;

  @ApiProperty({
    description: 'Effective LLM provider.',
    enum: ['deterministic', 'groq'],
    example: 'groq',
  })
  llmProvider!: string;

  @ApiProperty({
    description: 'Effective embedding provider.',
    enum: ['deterministic', 'gemini', 'openai'],
    example: 'gemini',
  })
  embeddingProvider!: string;

  @ApiProperty({
    description: 'Effective embedding model.',
    example: 'gemini-embedding-2',
    required: false,
  })
  embeddingModel?: string;

  @ApiProperty({
    description: 'Effective embedding dimensions.',
    example: 1536,
  })
  embeddingDimensions!: number;

  @ApiProperty({
    description:
      'Whether the app is running real GenAI RAG or deterministic fallback.',
    enum: ['genai', 'hybrid', 'deterministic'],
    example: 'genai',
  })
  ragMode!: string;

  @ApiProperty({
    description: 'Health check timestamp.',
    format: 'date-time',
    example: '2026-06-10T14:30:00.000Z',
  })
  timestamp!: string;
}
