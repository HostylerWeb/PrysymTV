import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateRevenueSplitRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  creatorBps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  platformBps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  gafBps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  creatorDevFundBps?: number;
}
