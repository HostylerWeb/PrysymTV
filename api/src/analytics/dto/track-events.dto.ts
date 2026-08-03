import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { AnalyticsEventType } from '@prisma/client';

export class AnalyticsTrackItemDto {
  @IsEnum(AnalyticsEventType)
  eventType!: AnalyticsEventType;

  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class TrackEventsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AnalyticsTrackItemDto)
  events!: AnalyticsTrackItemDto[];
}
