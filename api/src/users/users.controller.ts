import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateNotificationPrefDto } from './dto/notification-pref.dto';
import { ApplyStreamerDto } from './dto/apply-streamer.dto';
import { ReplaceSocialLinksDto } from './dto/social-links.dto';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthUserPayload) {
    return this.users.getMe(user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser() user: AuthUserPayload, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(user.id, dto);
  }

  @Post('me/avatar/upload')
  @UseGuards(JwtAuthGuard)
  initAvatarUpload(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: { mimeType: string; fileName?: string },
  ) {
    return this.users.initProfileImageUpload(
      user.id,
      'avatar',
      body.mimeType,
      body.fileName,
    );
  }

  @Post('me/banner/upload')
  @UseGuards(JwtAuthGuard)
  initBannerUpload(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: { mimeType: string; fileName?: string },
  ) {
    return this.users.initProfileImageUpload(
      user.id,
      'banner',
      body.mimeType,
      body.fileName,
    );
  }

  @Post('me/streamer-id/upload')
  @UseGuards(JwtAuthGuard)
  initStreamerIdUpload(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: { mimeType: string; fileName?: string },
  ) {
    return this.users.initStreamerIdUpload(
      user.id,
      body.mimeType,
      body.fileName,
    );
  }

  @Get('me/notification-preferences')
  @UseGuards(JwtAuthGuard)
  getNotificationPrefs(@CurrentUser() user: AuthUserPayload) {
    return this.users.getNotificationPreferences(user.id);
  }

  @Put('me/notification-preferences')
  @UseGuards(JwtAuthGuard)
  updateNotificationPref(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateNotificationPrefDto,
  ) {
    return this.users.updateNotificationPreference(user.id, dto);
  }

  @Put('me/social-links')
  @UseGuards(JwtAuthGuard)
  replaceSocialLinks(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: ReplaceSocialLinksDto,
  ) {
    return this.users.replaceSocialLinks(user.id, dto);
  }

  @Post('apply-streamer')
  @UseGuards(JwtAuthGuard)
  applyStreamer(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: ApplyStreamerDto,
  ) {
    return this.users.applyStreamer(user.id, dto);
  }

  @Get('me/videos')
  @UseGuards(JwtAuthGuard)
  myVideos(
    @CurrentUser() user: AuthUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.users.getMyVideos(
      user.id,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('me/saved')
  @UseGuards(JwtAuthGuard)
  mySaved(
    @CurrentUser() user: AuthUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.users.getMySaved(
      user.id,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('me/liked')
  @UseGuards(JwtAuthGuard)
  myLiked(
    @CurrentUser() user: AuthUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.users.getMyLiked(
      user.id,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('me/notifications')
  @UseGuards(JwtAuthGuard)
  notifications(
    @CurrentUser() user: AuthUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.users.getNotifications(
      user.id,
      Number(page) || 1,
      Number(limit) || 30,
    );
  }

  @Put('me/notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.users.markNotificationRead(user.id, id);
  }

  @Put('me/notifications/read-all')
  @UseGuards(JwtAuthGuard)
  markAllRead(@CurrentUser() user: AuthUserPayload) {
    return this.users.markAllNotificationsRead(user.id);
  }

  @Delete('me/notifications')
  @UseGuards(JwtAuthGuard)
  clearNotifications(@CurrentUser() user: AuthUserPayload) {
    return this.users.clearNotifications(user.id);
  }

  @Get(':username/videos')
  getPublicVideos(
    @Param('username') username: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.users.getPublicVideos(
      username,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 24,
    );
  }

  @Get(':username/playlists')
  getPublicPlaylists(@Param('username') username: string) {
    return this.users.getPublicPlaylists(username);
  }

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  getPublic(
    @Param('username') username: string,
    @CurrentUser() user?: AuthUserPayload | null,
  ) {
    return this.users.getPublicProfile(username, user?.id);
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  follow(
    @CurrentUser() user: AuthUserPayload,
    @Param('username') username: string,
  ) {
    return this.users.follow(user.id, username);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  unfollow(
    @CurrentUser() user: AuthUserPayload,
    @Param('username') username: string,
  ) {
    return this.users.unfollow(user.id, username);
  }

  @Post(':username/live-alerts')
  @UseGuards(JwtAuthGuard)
  toggleLiveAlerts(
    @CurrentUser() user: AuthUserPayload,
    @Param('username') username: string,
  ) {
    return this.users.toggleLiveAlert(user.id, username);
  }
}
