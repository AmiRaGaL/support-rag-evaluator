import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class RetrievalSearchBodyDto {
  @ApiProperty({
    description: 'Natural-language search query for support documentation.',
    example: 'reset two-factor authentication',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  query!: string;

  @ApiPropertyOptional({
    description: 'Maximum number of chunks to return.',
    minimum: 1,
    maximum: 20,
    example: 5,
  })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class RetrievalSearchQueryDto {
  @ApiProperty({
    description: 'Natural-language search query for support documentation.',
    example: 'change invoice email',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  q!: string;

  @ApiPropertyOptional({
    description: 'Maximum number of chunks to return.',
    minimum: 1,
    maximum: 20,
    example: 5,
  })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
