import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RevenueSourceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RevenueSplitService } from '../revenue/revenue-split.service';
import { SendGiftDto } from './dto/send-gift.dto';

/** USD value per coin for revenue ledger (configurable later). */
const COIN_USD = new Prisma.Decimal('0.01');

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revenueSplit: RevenueSplitService,
  ) {}

  async sendGift(senderId: string, dto: SendGiftDto) {
    const catalog = await this.prisma.giftCatalog.findUnique({
      where: { id: dto.giftId },
    });
    if (!catalog?.isActive) throw new NotFoundException('Gift not found');

    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) throw new NotFoundException('Sender not found');
    if (sender.coinsBalance < catalog.coinCost) {
      throw new BadRequestException('Insufficient coins');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver) throw new NotFoundException('Receiver not found');

    const grossUsd = COIN_USD.mul(catalog.coinCost);

    const gift = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: senderId },
        data: { coinsBalance: { decrement: catalog.coinCost } },
      });
      return tx.gift.create({
        data: {
          senderId,
          receiverId: dto.receiverId,
          streamId: dto.streamId,
          videoId: dto.videoId,
          giftType: catalog.id,
          coinValue: catalog.coinCost,
        },
      });
    });

    const { batch } = await this.revenueSplit.distributeAndPersist({
      ruleKey: 'viewer_support',
      sourceType: RevenueSourceType.gift,
      sourceId: gift.id,
      grossAmountUsd: grossUsd,
      creatorId: dto.receiverId,
      metadata: { giftId: catalog.id, coins: catalog.coinCost },
    });

    await this.prisma.gift.update({
      where: { id: gift.id },
      data: { revenueBatchId: batch.id },
    });

    const updatedSender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { coinsBalance: true },
    });

    return {
      success: true,
      giftId: gift.id,
      coinsSpent: catalog.coinCost,
      coinsRemaining: updatedSender?.coinsBalance ?? 0,
    };
  }
}
