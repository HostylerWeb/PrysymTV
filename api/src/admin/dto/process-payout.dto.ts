import { IsEnum } from 'class-validator';

export enum AdminPayoutAction {
  processing = 'processing',
  complete = 'complete',
  reject = 'reject',
}

export class ProcessPayoutDto {
  @IsEnum(AdminPayoutAction)
  action!: AdminPayoutAction;
}
