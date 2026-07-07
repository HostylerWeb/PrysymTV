import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

class PushSubscriptionKeysDto {
  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;
}

export class RegisterPushSubscriptionDto {
  @IsString()
  endpoint!: string;

  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys!: PushSubscriptionKeysDto;

  @IsOptional()
  expirationTime?: number | null;
}

export class UnregisterPushSubscriptionDto {
  @IsString()
  endpoint!: string;
}
