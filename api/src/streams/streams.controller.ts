import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { StreamsService } from './streams.service';

@Controller('streams')
export class StreamsController {
  constructor(private readonly streams: StreamsService) {}

  @Post('init')
  @UseGuards(JwtAuthGuard)
  init(@CurrentUser() user: AuthUserPayload, @Body() body: { title?: string }) {
    return this.streams.initStream(user.id, body.title?.trim() || 'Live Stream');
  }

  @Get('live')
  live() {
    return this.streams.listLive();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.streams.getOne(id);
  }
}
