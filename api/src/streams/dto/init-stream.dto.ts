import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class InitStreamDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['free', 'paid'])
  accessType?: 'free' | 'paid';

  @ValidateIf((o: InitStreamDto) => o.accessType === 'paid')
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  entryPriceUsd?: number;
}
