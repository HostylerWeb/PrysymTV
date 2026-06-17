import { IsNumber, Min } from 'class-validator';

export class RequestPayoutDto {
  @IsNumber()
  @Min(1)
  amountUsd!: number;
}
