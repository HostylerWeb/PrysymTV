import { SetMetadata } from '@nestjs/common';
import type { ContentServiceKey } from '../../platform-settings/platform-settings.types';

export const CONTENT_SERVICE_KEY = 'content_service';

export const RequireContentService = (service: ContentServiceKey) =>
  SetMetadata(CONTENT_SERVICE_KEY, service);
