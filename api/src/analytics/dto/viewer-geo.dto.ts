import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ViewerGeoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  regionName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;
}
