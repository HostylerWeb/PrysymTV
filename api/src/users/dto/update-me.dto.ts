import { IsIn, IsOptional, IsString, Length, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { USER_GENDER_VALUES } from '../../common/constants/user-gender';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  bannerUrl?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsIn([...USER_GENDER_VALUES])
  gender?: (typeof USER_GENDER_VALUES)[number] | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'birthDate must be YYYY-MM-DD',
  })
  birthDate?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  buyerFullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  buyerPhone?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  buyerAddressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  buyerAddressLine2?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  buyerCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  buyerState?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  buyerPostalCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  buyerCountryCode?: string;
}
