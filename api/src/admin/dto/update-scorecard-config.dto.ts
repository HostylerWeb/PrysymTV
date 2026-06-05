import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class ScorecardDisplayDto {
  @IsOptional()
  @IsIn(['hide', 'dash', 'zero'])
  showZeroRevenueLines?: 'hide' | 'dash' | 'zero';

  @IsOptional()
  @IsString()
  defaultImpactPeriod?: string;
}

class ScorecardModuleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  module!: number;

  @IsString()
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  percent!: number;

  @IsString()
  notes!: string;
}

export class UpdateScorecardConfigDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ScorecardDisplayDto)
  scorecardDisplay?: ScorecardDisplayDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScorecardModuleDto)
  moduleScorecard?: ScorecardModuleDto[];
}
