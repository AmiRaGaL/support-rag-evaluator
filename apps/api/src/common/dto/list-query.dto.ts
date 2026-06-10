import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_LIST_LIMIT = 20;
export const MAX_LIST_LIMIT = 50;
export const MIN_LIST_LIMIT = 1;

export class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_LIST_LIMIT)
  @Max(MAX_LIST_LIMIT)
  limit?: number;
}
