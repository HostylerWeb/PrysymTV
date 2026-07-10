import { GafProgramCategory } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateGafGrantDto {
  @IsNumber()
  @Min(0.01)
  amountUsd!: number;

  @IsEnum(GafProgramCategory)
  programCategory!: GafProgramCategory;

  @IsOptional()
  @IsUUID()
  gafProgramId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
