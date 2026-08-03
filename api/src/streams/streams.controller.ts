import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MediamtxWebhookGuard } from '../common/guards/mediamtx-webhook.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { InitStreamDto } from './dto/init-stream.dto';
import { StreamsService } from './streams.service';

@Controller('streams')
export class StreamsController {
  constructor(private readonly streams: StreamsService) {}

  @Post('init')
  @UseGuards(JwtAuthGuard)
  init(@CurrentUser() user: AuthUserPayload, @Body() body: InitStreamDto) {
    return this.streams.initStream(
      user.id,
      body.title?.trim() || 'Live Stream',
      body.category,
      body.accessType ?? 'free',
      body.entryPriceUsd,
    );
  }

  @Get('live')
  @UseGuards(OptionalJwtAuthGuard)
  live(@Req() req: Request & { user?: AuthUserPayload | null }) {
    return this.streams.listLive(req.user?.id);
  }

  @Get('ingest/health')
  ingestHealth() {
    return this.streams.ingestHealth();
  }

  /** MediaMTX external HTTP authentication (no JWT). */
  @Post('mediamtx/auth')
  @HttpCode(200)
  async mediamtxAuth(@Body() body: Record<string, unknown>, @Res() res: Response) {
    const result = await this.streams.mediamtxAuth(body as never);
    if (!result.allowed) {
      res.status(401).json({ status: 'error' });
      return;
    }
    res.status(200).json({ status: 'ok' });
  }

  @Post('webhooks/ready')
  @UseGuards(MediamtxWebhookGuard)
  @HttpCode(200)
  mediamtxReady(@Query('path') path: string) {
    return this.streams.mediamtxReady(path ?? '');
  }

  @Post('webhooks/done')
  @UseGuards(MediamtxWebhookGuard)
  @HttpCode(200)
  mediamtxDone(@Query('path') path: string) {
    return this.streams.mediamtxDone(path ?? '');
  }

  @Post(':id/unlock')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  unlockStream(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.streams.unlockStream(id, user.id);
  }

  @Post(':id/end')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  endStream(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.streams.endStream(id, user.id);
  }

  @Post(':id/thumbnail/upload')
  @UseGuards(JwtAuthGuard)
  initThumbnailUpload(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.streams.initThumbnailUpload(id, user.id);
  }

  @Post(':id/thumbnail/confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  confirmThumbnail(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.streams.confirmThumbnail(id, user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getOne(
    @Param('id') id: string,
    @Req() req: Request & { user?: AuthUserPayload | null },
  ) {
    return this.streams.getOne(id, req.user?.id);
  }
}
