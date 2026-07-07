import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleOAuthDto } from './dto/google-oauth.dto';
import { AppleOAuthDto } from './dto/apple-oauth.dto';
import { FacebookOAuthDto } from './dto/facebook-oauth.dto';
import { RefreshDto } from './dto/refresh.dto';

const REFRESH_COOKIE = 'prysym_refresh';

function readRefreshCookie(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[REFRESH_COOKIE];
  return typeof value === 'string' ? value : undefined;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.register(dto, res);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.auth.login(dto, res);
  }

  @Post('oauth/google')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  oauthGoogle(
    @Body() dto: GoogleOAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.oauthGoogle(dto, res);
  }

  @Post('oauth/apple')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  oauthApple(
    @Body() dto: AppleOAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.oauthApple(dto, res);
  }

  @Post('oauth/facebook')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  oauthFacebook(
    @Body() dto: FacebookOAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.oauthFacebook(dto, res);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  refresh(
    @Req() req: Request,
    @Body() body: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.refresh(
      body.refreshToken ?? readRefreshCookie(req),
      res,
    );
  }

  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.logout(readRefreshCookie(req), res);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }
}
