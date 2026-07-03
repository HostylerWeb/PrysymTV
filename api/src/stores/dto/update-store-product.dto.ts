import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
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
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  galleryUrls?: string[];

  @IsOptional()
  @IsUrl()
  digitalUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  inventoryUnlimited?: boolean;

  @ValidateIf((o: UpdateStoreProductDto) => o.inventory !== undefined && o.inventory !== null)
  @IsInt()
  @Min(1, { message: 'inventory must be at least 1, or enable unlimited stock' })
  inventory?: number | null;

  @IsOptional()
  @IsEnum(StoreProductStatus)
  status?: StoreProductStatus;
}
