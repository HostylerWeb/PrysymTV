import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePodcastEpisodeDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}
