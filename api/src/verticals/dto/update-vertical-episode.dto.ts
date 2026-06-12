import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateVerticalEpisodeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  episodeNumber?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cliffhanger?: string;
}
