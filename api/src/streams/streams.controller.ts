import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';

@Controller('streams')
export class StreamsController {
  @Post('init')
  @UseGuards(JwtAuthGuard)
  init(@CurrentUser() _user: AuthUserPayload) {
    return {
      streamKey: null,
      rtmpUrl: 'rtmp://live.prysym.tv/app',
      message: 'Week 4',
    };
  }

  @Get('live')
  live() {
    return { items: [] };
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return { id, message: 'Week 4' };
  }
}
