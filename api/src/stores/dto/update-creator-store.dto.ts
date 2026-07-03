import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateCreatorStoreDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  shippingFree?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999.99)
  shippingFeeUsd?: number;
}
