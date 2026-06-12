import { AdPlacement } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { ViewerGeoDto } from './viewer-geo.dto';

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

  /** Browser-reported city/region when server IP is private (e.g. localhost dev). */
  @IsOptional()
  @ValidateNested()
  @Type(() => ViewerGeoDto)
  viewerGeo?: ViewerGeoDto;
}
