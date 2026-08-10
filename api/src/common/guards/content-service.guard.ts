import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CONTENT_SERVICE_KEY } from '../decorators/require-content-service.decorator';
import { ContentServicesService } from '../../content-services/content-services.service';
import type { ContentServiceKey } from '../../platform-settings/platform-settings.types';

@Injectable()
export class ContentServiceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly contentServices: ContentServicesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const service = this.reflector.getAllAndOverride<ContentServiceKey | undefined>(
      CONTENT_SERVICE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!service) return true;
    await this.contentServices.assertEnabled(service);
    return true;
  }
}
