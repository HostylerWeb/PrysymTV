import { IsString, MinLength } from 'class-validator';

export class FulfillCheckoutDto {
  @IsString()
  @MinLength(8)
  sessionId!: string;
}
