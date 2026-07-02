import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum StoreCreatorApplicationAction {
  approve = 'approve',
  reject = 'reject',
}

export class ReviewStoreCreatorApplicationDto {
  @IsEnum(StoreCreatorApplicationAction)
  action!: StoreCreatorApplicationAction;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
