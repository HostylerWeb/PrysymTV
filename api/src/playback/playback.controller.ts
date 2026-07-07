import {
  Controller,
  Get,
  Header,
  Options,
  Req,
  Res,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { PlaybackService } from './playback.service';

@Controller('playback')
@SkipThrottle()
export class PlaybackController {
  constructor(private readonly playback: PlaybackService) {}

  @Options('*')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  @Header('Access-Control-Allow-Headers', '*')
  @Header('Access-Control-Max-Age', '86400')
  playbackPreflight() {
    return '';
  }

  @Get('*')
  async serve(@Req() req: Request, @Res() res: Response) {
    const prefix = '/api/v1/playback/';
    const path = req.path.startsWith(prefix) ? req.path.slice(prefix.length) : '';
    const slash = path.indexOf('/');
    if (slash <= 0) {
      res.status(404).json({ message: 'Playback path not found' });
      return;
    }

    const token = decodeURIComponent(path.slice(0, slash));
    const relativePath = decodeURIComponent(path.slice(slash + 1));

    try {
      const { body, contentType } = await this.playback.streamTokenPath(
        token,
        relativePath,
      );
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', '*');
      res.setHeader('Cache-Control', 'private, max-age=60');
      res.setHeader('Content-Type', contentType);
      res.status(200).send(body);
    } catch (err) {
      const status =
        err && typeof err === 'object' && 'getStatus' in err
          ? Number((err as { getStatus: () => number }).getStatus())
          : 502;
      res.status(status).json({
        message:
          err instanceof Error ? err.message : 'Playback request failed',
      });
    }
  }
}
