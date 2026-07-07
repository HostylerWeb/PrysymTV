import { IsOptional, IsString, MinLength } from 'class-validator';

export class AppleOAuthDto {
  @IsString()
  @MinLength(20)
  identityToken!: string;

  @IsOptional()
  @IsString()
  authorizationCode?: string;
}
