import { Injectable, NotFoundException } from '@nestjs/common';
import { AdCampaignStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdCampaignDto } from './dto/create-ad-campaign.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listAdCampaigns() {
    return this.prisma.adCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  createAdCampaign(dto: CreateAdCampaignDto) {
    return this.prisma.adCampaign.create({
      data: {
        advertiserName: dto.advertiserName,
        title: dto.title,
        mediaUrl: dto.mediaUrl,
        clickThroughUrl: dto.clickThroughUrl,
        placement: dto.placement,
        targetImpressions: dto.targetImpressions,
        budgetUsd: dto.budgetUsd,
        status: AdCampaignStatus.active,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      },
    });
  }

  async updateAdCampaignStatus(id: string, status: AdCampaignStatus) {
    try {
      return await this.prisma.adCampaign.update({
        where: { id },
        data: { status },
      });
    } catch {
      throw new NotFoundException('Campaign not found');
    }
  }
}
