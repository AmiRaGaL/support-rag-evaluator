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

export class ChatRequestDto {
  @ApiProperty({
    description: 'Support question to answer from retrieved documentation.',
    example: 'How do I update the billing email for my workspace?',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiPropertyOptional({
    description: 'Maximum number of retrieved chunks to use for grounding.',
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
