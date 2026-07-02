import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdvertisersService {
  constructor(private readonly prisma: PrismaService) {}

  async register(ownerUserId: string, body: {
    companyName: string;
    contactEmail: string;
    billingEmail?: string;
  }) {
    const companyName = body.companyName.trim();
    const contactEmail = body.contactEmail.trim().toLowerCase();
    const billingEmail = body.billingEmail?.trim().toLowerCase();

    if (!companyName) {
      throw new BadRequestException('companyName is required');
    }

    const existingPending = await this.prisma.advertiserAccount.findFirst({
      where: { ownerUserId, isVerified: false },
    });
    if (existingPending) {
      throw new ConflictException(
        'You already have a pending advertiser registration. Cancel it before submitting a new one.',
      );
    }

    return this.prisma.advertiserAccount.create({
      data: {
        ownerUserId,
        companyName,
        contactEmail,
        billingEmail: billingEmail || undefined,
      },
    });
  }

  async listMine(ownerUserId: string) {
    return this.prisma.advertiserAccount.findMany({
      where: { ownerUserId },
      include: { _count: { select: { campaigns: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelPending(ownerUserId: string, id: string) {
    const row = await this.prisma.advertiserAccount.findFirst({
      where: { id, ownerUserId },
      include: { _count: { select: { campaigns: true } } },
    });
    if (!row) {
      throw new NotFoundException('Advertiser account not found');
    }
    if (row.isVerified) {
      throw new BadRequestException('Verified advertiser accounts cannot be cancelled');
    }
    if (row._count.campaigns > 0) {
      throw new BadRequestException(
        'This registration is linked to campaigns and cannot be cancelled',
      );
    }
    await this.prisma.advertiserAccount.delete({ where: { id } });
    return { ok: true as const };
  }

  async getMine(ownerUserId: string, id: string) {
    const row = await this.prisma.advertiserAccount.findUnique({
      where: { id },
      include: { campaigns: { orderBy: { createdAt: 'desc' } } },
    });
    if (!row || row.ownerUserId !== ownerUserId) {
      throw new NotFoundException('Advertiser account not found');
    }
    return row;
  }

  adminList() {
    return this.prisma.advertiserAccount.findMany({
      include: {
        owner: { select: { id: true, username: true, displayName: true } },
        _count: { select: { campaigns: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminVerify(id: string, isVerified: boolean) {
    try {
      return await this.prisma.advertiserAccount.update({
        where: { id },
        data: { isVerified },
      });
    } catch {
      throw new NotFoundException('Advertiser account not found');
    }
  }

  async adminUpdate(
    id: string,
    body: {
      companyName?: string;
      contactEmail?: string;
      billingEmail?: string | null;
      isVerified?: boolean;
    },
  ) {
    const data: {
      companyName?: string;
      contactEmail?: string;
      billingEmail?: string | null;
      isVerified?: boolean;
    } = {};
    if (body.companyName !== undefined) {
      const name = body.companyName.trim();
      if (!name) throw new BadRequestException('companyName is required');
      data.companyName = name;
    }
    if (body.contactEmail !== undefined) {
      const email = body.contactEmail.trim();
      if (!email) throw new BadRequestException('contactEmail is required');
      data.contactEmail = email;
    }
    if (body.billingEmail !== undefined) {
      data.billingEmail = body.billingEmail?.trim() || null;
    }
    if (body.isVerified !== undefined) {
      data.isVerified = body.isVerified;
    }
    try {
      return await this.prisma.advertiserAccount.update({
        where: { id },
        data,
        include: {
          owner: { select: { id: true, username: true, displayName: true } },
          _count: { select: { campaigns: true } },
        },
      });
    } catch {
      throw new NotFoundException('Advertiser account not found');
    }
  }

  assertOwner(accountId: string, userId: string) {
    return this.prisma.advertiserAccount.findFirst({
      where: { id: accountId, ownerUserId: userId },
    }).then((row) => {
      if (!row) throw new ForbiddenException('Not your advertiser account');
      return row;
    });
  }
}
