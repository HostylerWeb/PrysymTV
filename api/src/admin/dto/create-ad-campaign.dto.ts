import { AdCampaignStatus, AdPlacement } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateAdCampaignDto {
  @IsString()
  advertiserName!: string;

  @IsString()
  title!: string;

  @IsUrl()
  mediaUrl!: string;

  @IsUrl()
  clickThroughUrl!: string;

  @IsEnum(AdPlacement)
  placement!: AdPlacement;

  @IsInt()
  @Min(1)
  targetImpressions!: number;

  @IsNumber()
  @Min(0)
  budgetUsd!: number;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsEnum(AdCampaignStatus)
  status?: AdCampaignStatus;
}
