import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpsertGiftCatalogDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  coinCost!: number;

  @IsString()
  animationKey!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
