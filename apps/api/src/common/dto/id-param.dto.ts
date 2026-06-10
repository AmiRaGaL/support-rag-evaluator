import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class IdParamDto {
  @ApiProperty({
    description: 'Resource identifier.',
    maxLength: 128,
    pattern: '^[A-Za-z0-9_-]+$',
    example: 'query_01J8Z7JQ8V7C4S2E9F5P3A1B2C',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'id must contain only letters, numbers, underscores, or hyphens',
  })
  id!: string;
}
