import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateUserImpactDto {
  @IsString()
  periodMonth!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  earningsUsd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  adRevenueUsd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sponsorshipRevenueUsd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  merchandiseRevenueUsd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  donationsUsd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  watchHours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  retentionRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  subscriberCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  engagementScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  jobsSupported?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  businessesFunded?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  dollarsInvested?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  workforceOpportunities?: number;
}
