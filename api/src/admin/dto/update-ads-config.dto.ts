import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

class AdsPlacementTogglesDto {
  @IsOptional()
  @IsBoolean()
  home_banner?: boolean;

  @IsOptional()
  @IsBoolean()
  shorts_interstitial?: boolean;

  @IsOptional()
  @IsBoolean()
  movie_preroll?: boolean;

  @IsOptional()
  @IsBoolean()
  vertical_episode?: boolean;
}

export class UpdateAdsConfigDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shortsInterstitialEveryNSwipes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  moviePrerollSkipSeconds?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  shortsSkipSeconds?: number;

  @IsOptional()
  @IsString()
  gafRuleKey?: string;

  @IsOptional()
  @IsObject()
  placements?: AdsPlacementTogglesDto;
}
