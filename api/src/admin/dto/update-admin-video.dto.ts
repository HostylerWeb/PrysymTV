import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CastMemberDto } from '../../videos/dto/cast-member.dto';

export class UpdateAdminVideoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  director?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  writers?: string;

  @IsOptional()
  @IsInt()
  @Min(1888)
  @Max(2100)
  releaseYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  ageRating?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CastMemberDto)
  cast?: CastMemberDto[];
}
