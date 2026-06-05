import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreatorBalanceEntryType,
  PayoutMethod,
  PayoutStatus,
  Prisma,
} from '@prisma/client';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { RequestPayoutDto } from './dto/request-payout.dto';

@Injectable()
export class CreatorsBalanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformSettings: PlatformSettingsService,
  ) {}

  async getBalance(creatorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Creator not found');

    const [available, minPayoutUsd] = await Promise.all([
      this.computeAvailableBalance(creatorId),
      this.platformSettings.getMinPayoutUsd(),
    ]);

    const [lifetimeCredits, pendingPayoutRows] = await Promise.all([
      this.prisma.creatorBalanceLedger.aggregate({
        where: { creatorId, entryType: CreatorBalanceEntryType.credit },
        _sum: { amountUsd: true },
      }),
      this.prisma.creatorPayout.findMany({
        where: {
          creatorId,
          status: { in: [PayoutStatus.requested, PayoutStatus.processing] },
        },
        select: { id: true, amountUsd: true, status: true, method: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      availableUsd: available.toFixed(2),
      minimumPayoutUsd: minPayoutUsd.toFixed(2),
      lifetimeCreditsUsd:
        lifetimeCredits._sum.amountUsd?.toFixed(4) ?? '0.0000',
      pendingPayouts: pendingPayoutRows.map((p) => ({
        id: p.id,
        amountUsd: p.amountUsd.toString(),
        status: p.status,
        method: p.method,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }

  async requestPayout(creatorId: string, dto: RequestPayoutDto) {
    const minPayoutUsd = await this.platformSettings.getMinPayoutUsd();
    const minPayout = new Prisma.Decimal(minPayoutUsd);
    const amount = new Prisma.Decimal(dto.amountUsd);
    if (amount.lt(minPayout)) {
      throw new BadRequestException(
        `Minimum payout is $${minPayout.toFixed(2)}`,
      );
    }

    const available = await this.computeAvailableBalance(creatorId);
    if (amount.gt(available)) {
      throw new BadRequestException('Insufficient available balance');
    }

    const payout = await this.prisma.$transaction(async (tx) => {
      const row = await tx.creatorPayout.create({
        data: {
          creatorId,
          amountUsd: amount,
          method: dto.method,
          status: PayoutStatus.requested,
        },
      });
      await tx.creatorBalanceLedger.create({
        data: {
          creatorId,
          entryType: CreatorBalanceEntryType.debit,
          amountUsd: amount,
          description: `Payout request ${row.id}`,
        },
      });
      return row;
    });

    const balance = await this.getBalance(creatorId);

    return {
      success: true,
      payout: {
        id: payout.id,
        amountUsd: payout.amountUsd.toString(),
        status: payout.status,
        method: payout.method,
        createdAt: payout.createdAt.toISOString(),
      },
      balance,
    };
  }

  /** Credits minus ledger debits (payout requests record a debit immediately). */
  async computeAvailableBalance(creatorId: string): Promise<Prisma.Decimal> {
    const [credits, debits] = await Promise.all([
      this.prisma.creatorBalanceLedger.aggregate({
        where: { creatorId, entryType: CreatorBalanceEntryType.credit },
        _sum: { amountUsd: true },
      }),
      this.prisma.creatorBalanceLedger.aggregate({
        where: { creatorId, entryType: CreatorBalanceEntryType.debit },
        _sum: { amountUsd: true },
      }),
    ]);

    const credit = credits._sum.amountUsd ?? new Prisma.Decimal(0);
    const debit = debits._sum.amountUsd ?? new Prisma.Decimal(0);
    const net = credit.minus(debit);
    return net.gt(0) ? net : new Prisma.Decimal(0);
  }
}
