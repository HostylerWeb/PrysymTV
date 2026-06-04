import { IsOptional, IsString } from 'class-validator';

export class PodcastUploadCompleteDto {
  @IsOptional()
  @IsString()
  objectKey?: string;
}
