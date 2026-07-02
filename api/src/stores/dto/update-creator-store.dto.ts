import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCreatorStoreDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
