import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterAdvertiserDto {
  @IsString()
  @MinLength(1, { message: 'companyName is required' })
  @MaxLength(200)
  companyName!: string;

  @IsEmail({}, { message: 'contactEmail must be a valid email address' })
  contactEmail!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== null && String(value).trim() !== '')
  @IsEmail({}, { message: 'billingEmail must be a valid email address' })
  billingEmail?: string;
}
