import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateVerticalEpisodeDto {
  @IsInt()
  @Min(1)
  episodeNumber!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  cliffhanger?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;
}
