import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePodcastShowDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;
}
