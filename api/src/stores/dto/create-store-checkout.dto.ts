import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingAddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  phone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  postalCode!: string;

  @IsString()
  @Length(2, 2)
  countryCode!: string;
}

export class StoreCheckoutLineDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number = 1;
}

export class CreateStoreCheckoutDto {
  @ValidateIf((o: CreateStoreCheckoutDto) => !o.items?.length)
  @IsUUID()
  productId?: string;

  @ValidateIf((o: CreateStoreCheckoutDto) => !o.items?.length)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;

  @ValidateIf((o: CreateStoreCheckoutDto) => !o.productId)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StoreCheckoutLineDto)
  items?: StoreCheckoutLineDto[];

  @ValidateIf((o: CreateStoreCheckoutDto) => o.shippingAddress !== undefined)
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsOptional()
  @IsBoolean()
  saveBuyerDetails?: boolean;
}
