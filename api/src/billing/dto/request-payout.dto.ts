import { IsEnum, IsNumber, Min } from 'class-validator';
import { PayoutMethod } from '@prisma/client';

export class RequestPayoutDto {
  @IsNumber()
  @Min(50)
  amountUsd!: number;

  @IsEnum(PayoutMethod)
  method!: PayoutMethod;
}
