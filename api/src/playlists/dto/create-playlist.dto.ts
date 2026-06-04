import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PlaylistType, Visibility } from '@prisma/client';

export class CreatePlaylistDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(PlaylistType)
  type!: PlaylistType;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}
