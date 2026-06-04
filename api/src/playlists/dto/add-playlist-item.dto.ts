import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { PlaylistItemType } from '@prisma/client';

export class AddPlaylistItemDto {
  @IsEnum(PlaylistItemType)
  itemType!: PlaylistItemType;

  @IsUUID()
  itemId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
