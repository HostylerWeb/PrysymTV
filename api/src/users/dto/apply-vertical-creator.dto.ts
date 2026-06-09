import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ApplyVerticalCreatorDto {
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(2048)
  idDocumentUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  portfolioUrl?: string;
}
