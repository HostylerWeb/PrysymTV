import { IsBoolean, IsOptional } from 'class-validator';
import type { ContentServicesSettings } from '../../platform-settings/platform-settings.types';

export class UpdateContentServicesConfigDto implements Partial<ContentServicesSettings> {
  @IsOptional()
  @IsBoolean()
  videos?: boolean;

  @IsOptional()
  @IsBoolean()
  movies?: boolean;

  @IsOptional()
  @IsBoolean()
  shorts?: boolean;

  @IsOptional()
  @IsBoolean()
  verticals?: boolean;

  @IsOptional()
  @IsBoolean()
  podcasts?: boolean;
}
