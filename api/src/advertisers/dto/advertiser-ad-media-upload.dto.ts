import { IsOptional, IsString } from 'class-validator';

export class AdvertiserAdMediaUploadDto {
  @IsString()
  mimeType!: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}
