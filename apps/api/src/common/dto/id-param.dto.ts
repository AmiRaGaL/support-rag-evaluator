import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class IdParamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'id must contain only letters, numbers, underscores, or hyphens',
  })
  id!: string;
}
