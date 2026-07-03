import {
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

export class CreateStoreCheckoutDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number = 1;

  @ValidateIf((o: CreateStoreCheckoutDto) => o.shippingAddress !== undefined)
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsOptional()
  @IsBoolean()
  saveBuyerDetails?: boolean;
}
