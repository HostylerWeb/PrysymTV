import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { generateSecureToken, hashToken } from '../common/utils/crypto.util';
import { AuthService } from './auth.service';

const USER_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const USER_CODE_LENGTH = 8;
const SESSION_TTL_MS = 10 * 60 * 1000;
const POLL_INTERVAL_MS = 2000;

function generateUserCode(): string {
  let code = '';
  for (let i = 0; i < USER_CODE_LENGTH; i++) {
    code += USER_CODE_CHARS[randomBytes(1)[0] % USER_CODE_CHARS.length];
  }
  return code;
}

function formatUserCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

function normalizeUserCode(code: string): string {
  return code.replace(/-/g, '').toUpperCase();
}

@Injectable()
export class TvAuthService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private auth: AuthService,
  ) {}

  async startSession() {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const pollToken = generateSecureToken(32);
    const deviceCode = generateSecureToken(32);

    let userCode = generateUserCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await this.prisma.tvAuthSession.findFirst({
        where: {
          userCode,
          expiresAt: { gt: new Date() },
          consumedAt: null,
        },
        select: { id: true },
      });
      if (!existing) break;
      userCode = generateUserCode();
    }

    const session = await this.prisma.tvAuthSession.create({
      data: {
        deviceCode,
        userCode,
        pollTokenHash: hashToken(pollToken),
        expiresAt,
      },
    });

    const formattedUserCode = formatUserCode(userCode);
    const frontend = this.config
      .get<string>('FRONTEND_URL')
      ?.replace(/\/$/, '');

    return {
      sessionId: session.id,
      userCode: formattedUserCode,
      pollToken,
      verificationUrl: `${frontend}/tv-login?code=${formattedUserCode}`,
      expiresAt: expiresAt.toISOString(),
      pollIntervalMs: POLL_INTERVAL_MS,
    };
  }

  async approve(userCode: string, userId: string) {
    const normalized = normalizeUserCode(userCode);
    const session = await this.prisma.tvAuthSession.findFirst({
      where: {
        userCode: normalized,
        expiresAt: { gt: new Date() },
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      throw new NotFoundException('TV login code not found or expired');
    }

    if (session.approvedAt) {
      throw new BadRequestException('TV login code already approved');
    }

    const tokens = await this.auth.issueTokensForClient(userId);

    await this.prisma.tvAuthSession.update({
      where: { id: session.id },
      data: {
        userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        approvedAt: new Date(),
      },
    });

    return { success: true };
  }

  async poll(sessionId: string, pollToken: string) {
    const session = await this.prisma.tvAuthSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || hashToken(pollToken) !== session.pollTokenHash) {
      throw new UnauthorizedException('Invalid TV auth session');
    }

    if (session.expiresAt <= new Date()) {
      return { status: 'expired' as const };
    }

    if (session.consumedAt) {
      return { status: 'consumed' as const };
    }

    if (!session.approvedAt || !session.accessToken || !session.refreshToken) {
      return { status: 'pending' as const };
    }

    await this.prisma.tvAuthSession.update({
      where: { id: session.id },
      data: { consumedAt: new Date() },
    });

    return {
      status: 'approved' as const,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
    };
  }
}
