import { IsString, Length, Matches } from 'class-validator';

export class ApproveTvDto {
  @IsString()
  @Length(8, 9)
  @Matches(/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/i, {
    message: 'userCode must be 8 characters, optionally formatted as XXXX-XXXX',
  })
  userCode!: string;
}
