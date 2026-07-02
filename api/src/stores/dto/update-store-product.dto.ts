import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { StoreProductStatus, StoreProductType } from '@prisma/client';

export class UpdateStoreProductDto {
  @IsOptional()
  @IsEnum(StoreProductType)
  productType?: StoreProductType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  priceUsd?: number;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  digitalUrl?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  inventory?: number | null;

  @IsOptional()
  @IsEnum(StoreProductStatus)
  status?: StoreProductStatus;
}
