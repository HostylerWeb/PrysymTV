import { AdCampaignStatus, AdPlacement, HomeBannerSize } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateAdCampaignDto {
  @IsOptional()
  @IsUUID()
  advertiserAccountId?: string | null;

  @IsOptional()
  @IsString()
  advertiserName?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl()
  mediaUrl?: string;

  @IsOptional()
  @IsIn(['image', 'video'])
  mediaType?: 'image' | 'video';

  @IsOptional()
  @IsUrl()
  clickThroughUrl?: string;

  @IsOptional()
  @IsEnum(AdPlacement)
  placement?: AdPlacement;

  @IsOptional()
  @IsEnum(HomeBannerSize)
  bannerSize?: HomeBannerSize | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetImpressions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetUsd?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsEnum(AdCampaignStatus)
  status?: AdCampaignStatus;

  @IsOptional()
  @IsString()
  revenueRuleKey?: string;
}
