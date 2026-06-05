import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';

class KpiVisibilityDto {
  @IsOptional()
  @IsBoolean()
  dau?: boolean;

  @IsOptional()
  @IsBoolean()
  liveNow?: boolean;

  @IsOptional()
  @IsBoolean()
  revenueToday?: boolean;

  @IsOptional()
  @IsBoolean()
  pendingReports?: boolean;

  @IsOptional()
  @IsBoolean()
  pendingPayouts?: boolean;
}

export class UpdateAnalyticsConfigDto {
  @IsOptional()
  @IsIn(['today', '7d', '30d'])
  defaultRange?: 'today' | '7d' | '30d';

  @IsOptional()
  @IsObject()
  kpiVisibility?: KpiVisibilityDto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  alertPendingReportsThreshold?: number;
}
