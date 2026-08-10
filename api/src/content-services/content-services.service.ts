import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { VideoType } from '@prisma/client';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import type {
  ContentServiceKey,
  ContentServicesSettings,
} from '../platform-settings/platform-settings.types';

export function contentServiceForVideoType(type: VideoType): ContentServiceKey {
  switch (type) {
    case VideoType.movie:
      return 'movies';
    case VideoType.short:
      return 'shorts';
    case VideoType.series_episode:
      return 'verticals';
    default:
      return 'videos';
  }
}

@Injectable()
export class ContentServicesService {
  constructor(private readonly platformSettings: PlatformSettingsService) {}

  get(): Promise<ContentServicesSettings> {
    return this.platformSettings.getContentServices();
  }

  async isEnabled(service: ContentServiceKey): Promise<boolean> {
    const settings = await this.get();
    return settings[service];
  }

  async assertEnabled(service: ContentServiceKey): Promise<void> {
    if (!(await this.isEnabled(service))) {
      throw new ServiceUnavailableException({
        code: 'SERVICE_DISABLED',
        service,
        message: 'This section is temporarily unavailable.',
      });
    }
  }

  async assertVideoTypeEnabled(type: VideoType): Promise<void> {
    return this.assertEnabled(contentServiceForVideoType(type));
  }
}
