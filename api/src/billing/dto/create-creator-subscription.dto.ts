import { IsIn, IsUUID } from 'class-validator';

export class CreateCreatorSubscriptionDto {
  @IsUUID()
  creatorId!: string;

  @IsIn(['basic', 'premium'])
  tier: 'basic' | 'premium' = 'basic';
}
