import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UploadCompleteDto {
  @IsUUID()
  videoId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  objectKey?: string;
}
