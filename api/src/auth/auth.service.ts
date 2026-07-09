import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Response } from 'express';
import { NotificationPrefType, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateSecureToken, hashToken } from '../common/utils/crypto.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleOAuthDto } from './dto/google-oauth.dto';
import { AppleOAuthDto } from './dto/apple-oauth.dto';
import { FacebookOAuthDto } from './dto/facebook-oauth.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { MailService } from '../mail/mail.service';
import { OAuthVerificationService } from './oauth-verification.service';

const REFRESH_COOKIE = 'prysym_refresh';
const NOTIFICATION_TYPES: NotificationPrefType[] = [
  'follow',
  'like',
  'comment',
  'gift',
  'live',
  'upload',
  'system',
];

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
    private oauth: OAuthVerificationService,
  ) {}

  async register(dto: RegisterDto, res: Response) {
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        username: dto.username.toLowerCase(),
        displayName: dto.displayName,
        passwordHash,
        gender: dto.gender,
        role: UserRole.user,
        notificationPrefs: {
          create: NOTIFICATION_TYPES.map((type) => ({ type, enabled: true })),
        },
      },
    });
    return this.issueTokens(user.id, user.email, user.username, user.role, res);
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user?.passwordHash || user.isBanned) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id, user.email, user.username, user.role, res);
  }

  async oauthGoogle(dto: GoogleOAuthDto, res: Response) {
    const profile = await this.oauth.verifyGoogleIdToken(dto.idToken);
    if (!profile.email) {
      throw new BadRequestException(
        'Google did not share an email address. Use a Google account with email access.',
      );
    }
    if (!profile.emailVerified) {
      throw new BadRequestException('Google email is not verified');
    }
    const user = await this.resolveOAuthUser({
      provider: 'google',
      providerId: profile.sub,
      email: profile.email,
      displayName: profile.name,
      avatarUrl: profile.picture,
    });
    return this.issueTokens(user.id, user.email, user.username, user.role, res);
  }

  async oauthApple(dto: AppleOAuthDto, res: Response) {
    const profile = await this.oauth.verifyAppleIdentityToken(dto.identityToken);
    if (profile.email && !profile.emailVerified) {
      throw new BadRequestException('Apple email is not verified');
    }
    const user = await this.resolveOAuthUser({
      provider: 'apple',
      providerId: profile.sub,
      email: profile.email,
      displayName: undefined,
      avatarUrl: undefined,
    });
    return this.issueTokens(user.id, user.email, user.username, user.role, res);
  }

  async oauthFacebook(dto: FacebookOAuthDto, res: Response) {
    const profile = await this.oauth.verifyFacebookAccessToken(dto.accessToken);
    if (!profile.email) {
      throw new BadRequestException(
        'Facebook did not share an email address. Allow email access and try again.',
      );
    }
    const user = await this.resolveOAuthUser({
      provider: 'facebook',
      providerId: profile.sub,
      email: profile.email,
      displayName: profile.name,
      avatarUrl: profile.picture,
    });
    return this.issueTokens(user.id, user.email, user.username, user.role, res);
  }

  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const tokenHash = hashToken(refreshToken);
    const session = await this.prisma.refreshSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!session || session.user.isBanned) {
      throw new UnauthorizedException('Invalid refresh session');
    }
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(
      session.user.id,
      session.user.email,
      session.user.username,
      session.user.role,
      res,
    );
  }

  async logout(refreshToken: string | undefined, res: Response) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await this.prisma.refreshSession.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    this.clearRefreshCookie(res);
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      return {
        success: true,
        message: 'If the email exists, a reset link was sent.',
      };
    }
    const rawToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt,
      },
    });
    try {
      await this.mail.sendPasswordReset(user.email, rawToken);
    } catch (err) {
      const resetUrl = `${this.config.get<string>('FRONTEND_URL')?.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
      this.config.get('NODE_ENV') === 'development'
        ? console.error(
            `[dev] Password reset email FAILED for ${user.email}. Use this link locally:\n${resetUrl}\n`,
            err,
          )
        : undefined;
      if (this.config.get('NODE_ENV') !== 'development') {
        throw err;
      }
    }
    return {
      success: true,
      message: 'If the email exists, a reset link was sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);
    const reset = await this.prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });
    if (!reset) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { used: true },
      }),
      this.prisma.refreshSession.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { success: true };
  }

  private async issueTokens(
    userId: string,
    email: string,
    username: string,
    role: UserRole,
    res: Response,
  ) {
    const payload: JwtPayload = { sub: userId, email, username, role };
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL', '15m');
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn:
        accessTtl as `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`,
    });

    const refreshRaw = generateSecureToken(48);
    const refreshExpires = this.parseTtlMs(
      this.config.get('JWT_REFRESH_TTL', '7d'),
    );
    await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash: hashToken(refreshRaw),
        expiresAt: new Date(Date.now() + refreshExpires),
      },
    });

    this.setRefreshCookie(res, refreshRaw, refreshExpires);

    return {
      accessToken,
      refreshToken: refreshRaw,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
      user: { id: userId, email, username, role },
    };
  }

  private deriveUsername(displayName: string, email: string): string {
    const fromName = displayName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 30);
    if (fromName.length >= 3) return fromName;
    const fromEmail = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);
    return fromEmail.length >= 3
      ? fromEmail
      : `user_${Date.now().toString(36)}`;
  }

  private async ensureUniqueUsername(base: string): Promise<string> {
    let username = base.slice(0, 30);
    let suffix = 0;
    while (
      await this.prisma.user.findUnique({
        where: { username },
        select: { id: true },
      })
    ) {
      suffix += 1;
      const stem = base.slice(0, Math.max(3, 28 - String(suffix).length));
      username = `${stem}_${suffix}`;
    }
    return username;
  }

  private async resolveOAuthUser(params: {
    provider: 'google' | 'apple' | 'facebook';
    providerId: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const { provider, providerId, email, displayName, avatarUrl } = params;

    const providerWhere =
      provider === 'google'
        ? { googleId: providerId }
        : provider === 'apple'
          ? { appleId: providerId }
          : { facebookId: providerId };

    const byProvider = await this.prisma.user.findFirst({
      where: providerWhere,
    });
    if (byProvider) {
      if (byProvider.isBanned) {
        throw new UnauthorizedException('Account suspended');
      }
      return byProvider;
    }

    if (email) {
      const byEmail = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (byEmail) {
        if (byEmail.isBanned) {
          throw new UnauthorizedException('Account suspended');
        }
        if (
          provider === 'google' &&
          byEmail.googleId &&
          byEmail.googleId !== providerId
        ) {
          throw new BadRequestException(
            'Email is already linked to another Google account',
          );
        }
        if (
          provider === 'apple' &&
          byEmail.appleId &&
          byEmail.appleId !== providerId
        ) {
          throw new BadRequestException(
            'Email is already linked to another Apple account',
          );
        }
        if (
          provider === 'facebook' &&
          byEmail.facebookId &&
          byEmail.facebookId !== providerId
        ) {
          throw new BadRequestException(
            'Email is already linked to another Facebook account',
          );
        }

        const providerAlreadyLinked =
          provider === 'google'
            ? byEmail.googleId === providerId
            : provider === 'apple'
              ? byEmail.appleId === providerId
              : byEmail.facebookId === providerId;

        if (
          byEmail.passwordHash &&
          !providerAlreadyLinked &&
          !(provider === 'google'
            ? byEmail.googleId
            : provider === 'apple'
              ? byEmail.appleId
              : byEmail.facebookId)
        ) {
          throw new BadRequestException(
            'An account with this email already exists. Sign in with your email and password instead.',
          );
        }

        return this.prisma.user.update({
          where: { id: byEmail.id },
          data: {
            ...(provider === 'google' ? { googleId: providerId } : {}),
            ...(provider === 'apple' ? { appleId: providerId } : {}),
            ...(provider === 'facebook' ? { facebookId: providerId } : {}),
            ...(avatarUrl && !byEmail.avatarUrl ? { avatarUrl } : {}),
            ...(displayName && !byEmail.displayName
              ? { displayName }
              : {}),
          },
        });
      }
    }

    if (!email) {
      throw new BadRequestException(
        'Email is required to create an account. Sign in again and allow email sharing.',
      );
    }

    const username = await this.ensureUniqueUsername(
      this.deriveUsername(displayName ?? '', email),
    );

    return this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        displayName: displayName ?? username,
        avatarUrl: avatarUrl ?? null,
        googleId: provider === 'google' ? providerId : null,
        appleId: provider === 'apple' ? providerId : null,
        facebookId: provider === 'facebook' ? providerId : null,
        role: UserRole.user,
        notificationPrefs: {
          create: NOTIFICATION_TYPES.map((type) => ({
            type,
            enabled: true,
          })),
        },
      },
    });
  }

  private setRefreshCookie(res: Response, token: string, maxAgeMs: number) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: maxAgeMs,
      path: '/api/v1/auth',
    });
  }

  private clearRefreshCookie(res: Response) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/api/v1/auth',
    });
  }

  private parseTtlMs(ttl: string): number {
    const match = /^(\d+)([dhms])$/.exec(ttl);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const n = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      d: 86400000,
      h: 3600000,
      m: 60000,
      s: 1000,
    };
    return n * (multipliers[unit] ?? 86400000);
  }
}
