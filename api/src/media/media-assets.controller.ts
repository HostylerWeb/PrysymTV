import {
  Controller,
  Get,
  NotFoundException,
  Req,
  Res,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { StorageService } from '../storage/storage.service';
import { isPublicAssetKey } from '../common/media-asset.util';

@Controller('assets')
@SkipThrottle()
export class MediaAssetsController {
  constructor(private readonly storage: StorageService) {}

  @Get('*')
  async serve(@Req() req: Request, @Res() res: Response) {
    const prefix = '/api/v1/assets/';
    const objectKey = req.path.startsWith(prefix)
      ? req.path.slice(prefix.length)
      : '';
    const normalized = decodeURIComponent(objectKey).replace(/^\/+/, '');

    if (!normalized || normalized.includes('..') || !isPublicAssetKey(normalized)) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    try {
      const { body, contentType } = await this.storage.getObjectBytes(normalized);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      res.setHeader('Content-Type', contentTypeFor(normalized, contentType));
      res.status(200).send(body);
    } catch {
      throw new NotFoundException('Asset not found');
    }
  }
}

function contentTypeFor(pathname: string, upstream: string | null): string {
  const fromHeader = upstream?.split(';')[0]?.trim();
  if (fromHeader) return fromHeader;
  const lower = pathname.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}
