import { AdCampaignStatus, AdPlacement } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class UpdateAdvertiserCampaignDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl()
  mediaUrl?: string;

  @IsOptional()
  @IsUrl()
  clickThroughUrl?: string;

  @IsOptional()
  @IsEnum(AdPlacement)
  placement?: AdPlacement;

  @IsOptional()
  @IsIn(['strip', 'standard', 'hero'])
  bannerSize?: 'strip' | 'standard' | 'hero' | null;

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
}
