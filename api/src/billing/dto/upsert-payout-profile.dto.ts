import { IsEnum, IsObject } from 'class-validator';
import { PayoutMethod } from '@prisma/client';

export class UpsertPayoutProfileDto {
  @IsEnum(PayoutMethod)
  method!: PayoutMethod;

  @IsObject()
  details!: Record<string, string>;
}
