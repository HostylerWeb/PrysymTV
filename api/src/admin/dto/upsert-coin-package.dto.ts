import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpsertCoinPackageDto {
  @IsString()
  id!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  coins!: number;

  /** Ignored — computed server-side from coins × economy coinUsd */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceUsd?: number;

  @IsString()
  label!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
