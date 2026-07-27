import { AdPlacement } from '@prisma/client';
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

export class CreateAdvertiserCampaignDto {
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
  @IsIn(['strip', 'standard', 'hero'])
  bannerSize?: 'strip' | 'standard' | 'hero';
}
