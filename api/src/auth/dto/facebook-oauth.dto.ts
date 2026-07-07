import { IsString, MinLength } from 'class-validator';

export class FacebookOAuthDto {
  @IsString()
  @MinLength(20)
  accessToken!: string;
}
