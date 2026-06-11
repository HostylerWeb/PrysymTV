import { IsDateString, IsOptional, IsString } from 'class-validator';

export class AdminDateRangeQueryDto {
  @IsOptional()
  @IsString()
  range?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
