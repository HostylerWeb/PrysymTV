import { AdPlacement } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class TrackContentAdDto {
  @IsUUID()
  campaignId!: string;

  @IsOptional()
  @IsUUID()
  creatorId?: string;

  @IsOptional()
  @IsUUID()
  videoId?: string;

  @IsEnum(AdPlacement)
  placement!: AdPlacement;

  @IsOptional()
  @IsUUID()
  viewerUserId?: string;
}
