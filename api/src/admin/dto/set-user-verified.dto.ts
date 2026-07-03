import { IsBoolean } from 'class-validator';

export class SetUserVerifiedDto {
  @IsBoolean()
  isVerified!: boolean;
}
