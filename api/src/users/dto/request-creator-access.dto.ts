import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum CreatorAccessFeature {
  vertical = 'vertical',
  live = 'live',
}

export class RequestCreatorAccessDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(CreatorAccessFeature, { each: true })
  features!: CreatorAccessFeature[];

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;
}
