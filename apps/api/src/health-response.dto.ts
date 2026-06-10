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
    description: 'Health check timestamp.',
    format: 'date-time',
    example: '2026-06-10T14:30:00.000Z',
  })
  timestamp!: string;
}
