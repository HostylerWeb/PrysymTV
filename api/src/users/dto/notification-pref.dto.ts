import { IsBoolean, IsEnum } from 'class-validator';
import { NotificationPrefType } from '@prisma/client';

export class UpdateNotificationPrefDto {
  @IsEnum(NotificationPrefType)
  type!: NotificationPrefType;

  @IsBoolean()
  enabled!: boolean;
}
