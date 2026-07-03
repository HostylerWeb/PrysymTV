import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
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
import { StoreProductType } from '@prisma/client';

const SELLER_PRODUCT_TYPES = [
  StoreProductType.merchandise,
  StoreProductType.digital,
] as const;

export class CreateStoreProductDto {
  @IsIn(SELLER_PRODUCT_TYPES)
  productType!: StoreProductType;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsNumber()
  @Min(0.01)
  priceUsd!: number;

  @IsUrl()
  imageUrl!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  galleryUrls?: string[];

  @ValidateIf((o: CreateStoreProductDto) => o.productType === StoreProductType.digital)
  @IsUrl()
  digitalUrl?: string;

  @ValidateIf(
    (o: CreateStoreProductDto) =>
      o.productType === StoreProductType.merchandise && !o.inventoryUnlimited,
  )
  @IsInt()
  @Min(1, { message: 'inventory must be at least 1, or enable unlimited stock' })
  inventory?: number;

  @ValidateIf((o: CreateStoreProductDto) => o.productType === StoreProductType.merchandise)
  @IsOptional()
  @IsBoolean()
  inventoryUnlimited?: boolean;
}
