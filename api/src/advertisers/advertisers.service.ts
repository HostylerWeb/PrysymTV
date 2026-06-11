import {
  BadRequestException,
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
    return this.prisma.advertiserAccount.create({
      data: {
        ownerUserId,
        companyName: body.companyName.trim(),
        contactEmail: body.contactEmail.trim(),
        billingEmail: body.billingEmail?.trim(),
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
