import { IsOptional, IsString } from 'class-validator';

export class PodcastUploadInitDto {
  @IsString()
  mimeType!: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}
