import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const UPLOAD_TYPES = ['short', 'video', 'movie', 'podcast'] as const;

export class UploadInitDto {
  @IsIn(UPLOAD_TYPES)
  type!: (typeof UPLOAD_TYPES)[number];

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  mimeType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;
}
