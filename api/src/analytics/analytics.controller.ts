import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';

@Controller('analytics')
export class AnalyticsController {
  @Post('track')
  track(@Body() _body: Record<string, unknown>) {
    return { success: true, message: 'Week 6 — batch to Redis' };
  }

  @Get('creators/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.creator, UserRole.admin)
  creatorStats(@CurrentUser() _user: AuthUserPayload) {
    return {
      views24h: 0,
      views7d: 0,
      views30d: 0,
      earnings30d: 0,
      topContent: [],
      message: 'Week 9',
    };
  }
}
