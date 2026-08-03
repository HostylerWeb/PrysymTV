import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class MediamtxWebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('MEDIAMTX_WEBHOOK_SECRET')?.trim();
    if (!expected) {
      const env = this.config.get<string>('NODE_ENV', 'development');
      if (env !== 'production') return true;
      throw new UnauthorizedException('Webhook secret is not configured');
    }

    const req = context.switchToHttp().getRequest<Request>();
    const headerSecret = req.header('x-mediamtx-webhook-secret')?.trim();
    const querySecret =
      typeof req.query.secret === 'string' ? req.query.secret.trim() : undefined;
    const provided = headerSecret || querySecret;

    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    return true;
  }
}
