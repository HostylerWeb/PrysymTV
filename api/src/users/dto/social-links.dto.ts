import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class SocialLinkItemDto {
  @IsString()
  @MaxLength(50)
  label!: string;

  @IsString()
  @MaxLength(2048)
  url!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ReplaceSocialLinksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkItemDto)
  links!: SocialLinkItemDto[];
}
