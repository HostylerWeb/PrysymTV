import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Visibility } from '@prisma/client';

export class UpdatePlaylistDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}
