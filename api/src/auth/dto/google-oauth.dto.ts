import { IsString, MinLength } from 'class-validator';

export class GoogleOAuthDto {
  @IsString()
  @MinLength(20)
  idToken!: string;
}
