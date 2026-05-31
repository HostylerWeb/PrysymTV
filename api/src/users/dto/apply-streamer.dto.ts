import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ApplyStreamerDto {
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  idDocumentUrl?: string;
}
