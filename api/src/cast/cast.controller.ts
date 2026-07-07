import {
  Controller,
  Get,
  Header,
  Options,
  Query,
  Res,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CastService } from './cast.service';

@Controller('cast')
@SkipThrottle()
export class CastController {
  constructor(private readonly cast: CastService) {}

  @Options('proxy')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  @Header('Access-Control-Allow-Headers', '*')
  @Header('Access-Control-Max-Age', '86400')
  castProxyPreflight() {
    return '';
  }

  @Get('proxy')
  async castProxy(@Query('url') url: string | undefined, @Res() res: Response) {
    if (!url?.trim()) {
      res.status(400).json({ message: 'Missing url query parameter' });
      return;
    }

    try {
      const { body, contentType } = await this.cast.fetchForCast(url.trim());
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', '*');
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.setHeader('Content-Type', contentType);
      res.status(200).send(body);
    } catch (err) {
      const status =
        err && typeof err === 'object' && 'getStatus' in err
          ? Number((err as { getStatus: () => number }).getStatus())
          : 502;
      res.status(status).json({
        message:
          err instanceof Error ? err.message : 'Cast proxy request failed',
      });
    }
  }
}
