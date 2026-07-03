import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UploadMimeInitDto {
  @IsString()
  @Matches(/^[a-z]+\/[a-z0-9.+-]+$/i, { message: 'mimeType must be a valid MIME type' })
  mimeType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;
}
