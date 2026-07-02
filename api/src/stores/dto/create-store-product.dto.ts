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
  ValidateIf,
} from 'class-validator';
import { StoreProductType } from '@prisma/client';

export class CreateStoreProductDto {
  @IsEnum(StoreProductType)
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

  @ValidateIf((o: CreateStoreProductDto) => o.productType === 'digital')
  @IsUrl()
  digitalUrl?: string;

  @ValidateIf((o: CreateStoreProductDto) => o.productType === 'merchandise')
  @IsInt()
  @Min(0)
  inventory?: number;
}
