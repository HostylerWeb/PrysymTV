import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdCampaignStatus, Prisma } from '@prisma/client';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateAdvertiserCampaignDto } from './dto/create-advertiser-campaign.dto';
import { UpdateAdvertiserCampaignDto } from './dto/update-advertiser-campaign.dto';

@Injectable()
export class AdvertisersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformSettings: PlatformSettingsService,
    private readonly storage: StorageService,
  ) {}

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

  async getCampaignAnalytics(
    ownerUserId: string,
    accountId: string,
    campaignId: string,
  ) {
    await this.assertOwner(accountId, ownerUserId);
    const campaign = await this.prisma.adCampaign.findFirst({
      where: { id: campaignId, advertiserAccountId: accountId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const adsConfig = await this.platformSettings.getAds();
    const cpmUsd = adsConfig.impressionRevenueCpmUsd;
    const spentUsd = Number(
      new Prisma.Decimal(cpmUsd).div(1000).mul(campaign.deliveredImpressions),
    );
    const budgetUsd = Number(campaign.budgetUsd);
    const deliveryPct =
      campaign.targetImpressions > 0
        ? (campaign.deliveredImpressions / campaign.targetImpressions) * 100
        : 0;

    const [trackedImpressions, trackedClicks] = await Promise.all([
      this.prisma.contentAdEvent.count({
        where: { campaignId, eventType: 'ad_impression' },
      }),
      this.prisma.contentAdEvent.count({
        where: { campaignId, eventType: 'ad_click' },
      }),
    ]);

    const servedImpressions = campaign.deliveredImpressions;
    const clickCount = campaign.clicks;

    return {
      campaign: {
        id: campaign.id,
        title: campaign.title,
        placement: campaign.placement,
        status: campaign.status,
        targetImpressions: campaign.targetImpressions,
        deliveredImpressions: servedImpressions,
        clicks: clickCount,
        budgetUsd,
        spentUsd,
        startsAt: campaign.startsAt.toISOString(),
        endsAt: campaign.endsAt.toISOString(),
      },
      summary: {
        servedImpressions,
        targetImpressions: campaign.targetImpressions,
        deliveryPercent: deliveryPct,
        clicks: clickCount,
        ctrPercent:
          servedImpressions > 0 ? (clickCount / servedImpressions) * 100 : 0,
        trackedImpressions,
        trackedClicks,
        budgetUsd,
        spentUsd,
        budgetRemainingUsd: Math.max(0, budgetUsd - spentUsd),
        cpmUsd,
      },
    };
  }

  private async assertVerifiedOwner(accountId: string, userId: string) {
    const row = await this.assertOwner(accountId, userId);
    if (!row.isVerified) {
      throw new ForbiddenException('Advertiser account must be verified to manage campaigns');
    }
    return row;
  }

  async createCampaign(
    ownerUserId: string,
    accountId: string,
    dto: CreateAdvertiserCampaignDto,
  ) {
    const account = await this.assertVerifiedOwner(accountId, ownerUserId);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    return this.prisma.adCampaign.create({
      data: {
        advertiserAccountId: account.id,
        advertiserName: account.companyName,
        title: dto.title.trim(),
        mediaUrl: dto.mediaUrl,
        clickThroughUrl: dto.clickThroughUrl,
        placement: dto.placement,
        ...(dto.bannerSize !== undefined && { bannerSize: dto.bannerSize }),
        targetImpressions: dto.targetImpressions,
        budgetUsd: dto.budgetUsd,
        status: AdCampaignStatus.draft,
        startsAt,
        endsAt,
        revenueRuleKey: 'ad_gaf_allocation',
      },
    });
  }

  async updateCampaign(
    ownerUserId: string,
    accountId: string,
    campaignId: string,
    dto: UpdateAdvertiserCampaignDto,
  ) {
    await this.assertVerifiedOwner(accountId, ownerUserId);
    const campaign = await this.prisma.adCampaign.findFirst({
      where: { id: campaignId, advertiserAccountId: accountId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    if (campaign.status === AdCampaignStatus.completed) {
      throw new BadRequestException('Completed campaigns cannot be edited');
    }

    const data: Prisma.AdCampaignUpdateInput = {};
    const editableStatuses: AdCampaignStatus[] = [
      AdCampaignStatus.draft,
      AdCampaignStatus.paused,
    ];
    const canEditFields = editableStatuses.includes(campaign.status);

    if (dto.status !== undefined) {
      if (
        dto.status === AdCampaignStatus.active &&
        campaign.status !== AdCampaignStatus.draft &&
        campaign.status !== AdCampaignStatus.paused
      ) {
        throw new BadRequestException('Only draft or paused campaigns can be activated');
      }
      if (
        dto.status === AdCampaignStatus.paused &&
        campaign.status !== AdCampaignStatus.active
      ) {
        throw new BadRequestException('Only active campaigns can be paused');
      }
      data.status = dto.status;
    }

    if (!canEditFields) {
      if (Object.keys(data).length === 0) {
        throw new BadRequestException('Active campaigns can only be paused');
      }
      return this.prisma.adCampaign.update({ where: { id: campaignId }, data });
    }

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.mediaUrl !== undefined) data.mediaUrl = dto.mediaUrl;
    if (dto.clickThroughUrl !== undefined) data.clickThroughUrl = dto.clickThroughUrl;
    if (dto.placement !== undefined) data.placement = dto.placement;
    if (dto.bannerSize !== undefined) {
      (data as Prisma.AdCampaignUpdateInput & { bannerSize?: typeof dto.bannerSize }).bannerSize =
        dto.bannerSize;
    }
    if (dto.targetImpressions !== undefined) data.targetImpressions = dto.targetImpressions;
    if (dto.budgetUsd !== undefined) data.budgetUsd = dto.budgetUsd;
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) data.endsAt = new Date(dto.endsAt);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No changes provided');
    }

    return this.prisma.adCampaign.update({ where: { id: campaignId }, data });
  }

  async initAdMediaUpload(
    ownerUserId: string,
    accountId: string,
    body: { mimeType: string; fileName?: string },
  ) {
    await this.assertVerifiedOwner(accountId, ownerUserId);
    if (!body.mimeType?.trim()) {
      throw new BadRequestException('mimeType is required');
    }
    const target = await this.storage.createAdMediaUploadTarget(
      body.mimeType.trim(),
      body.fileName,
    );
    return {
      objectKey: target.objectKey,
      uploadUrl: target.uploadUrl,
      uploadMethod: target.uploadMethod,
      uploadHeaders: target.uploadHeaders,
      expiresIn: target.expiresIn,
      publicUrl: this.storage.getPublicUrl(target.objectKey),
    };
  }
}
