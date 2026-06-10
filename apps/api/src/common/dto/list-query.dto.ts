import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min, ValidateIf } from 'class-validator';

export const DEFAULT_LIST_LIMIT = 20;
export const MAX_LIST_LIMIT = 50;
export const MIN_LIST_LIMIT = 1;

export class ListQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of recent records to return.',
    minimum: MIN_LIST_LIMIT,
    maximum: MAX_LIST_LIMIT,
    default: DEFAULT_LIST_LIMIT,
    example: 20,
  })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(MIN_LIST_LIMIT)
  @Max(MAX_LIST_LIMIT)
  limit?: number;
}
