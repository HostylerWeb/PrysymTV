import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CastMemberDto } from './cast-member.dto';

const UPLOAD_TYPES = ['short', 'video', 'movie', 'podcast'] as const;

export class UploadInitDto {
  @IsIn(UPLOAD_TYPES)
  type!: (typeof UPLOAD_TYPES)[number];

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @IsOptional()
  @IsIn(['public', 'private', 'unlisted'])
  visibility?: 'public' | 'private' | 'unlisted';

  /** Comma-separated tags, e.g. "gaming,tutorial" */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tags?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  mimeType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  releaseYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  ageRating?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  director?: string;

  /** Comma-separated writer names */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  writers?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CastMemberDto)
  cast?: CastMemberDto[];
}
