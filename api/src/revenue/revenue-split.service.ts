import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RevenueParty, RevenueSourceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type SplitAllocation = {
  party: RevenueParty;
  amountUsd: Prisma.Decimal;
};

export type DistributeResult = {
  ruleKey: string;
  grossAmountUsd: Prisma.Decimal;
  allocations: SplitAllocation[];
};

@Injectable()
export class RevenueSplitService {
  constructor(private readonly prisma: PrismaService) {}

  async getRule(ruleKey: string) {
    const rule = await this.prisma.revenueSplitRule.findUnique({
      where: { ruleKey },
    });
    if (!rule) {
      throw new NotFoundException(`Revenue split rule not found: ${ruleKey}`);
    }
    this.validateRule(rule);
    return rule;
  }

  async listRules() {
    const rules = await this.prisma.revenueSplitRule.findMany({
      orderBy: { ruleKey: 'asc' },
    });
    for (const rule of rules) {
      this.validateRule(rule);
    }
    return rules;
  }

  async updateRule(
    ruleKey: string,
    data: {
      name?: string;
      description?: string;
      creatorBps?: number;
      platformBps?: number;
      gafBps?: number;
      creatorDevFundBps?: number;
    },
    adminUserId?: string,
  ) {
    const current = await this.getRule(ruleKey);
    const updated = {
      name: data.name ?? current.name,
      description: data.description ?? current.description,
      creatorBps: data.creatorBps ?? current.creatorBps,
      platformBps: data.platformBps ?? current.platformBps,
      gafBps: data.gafBps ?? current.gafBps,
      creatorDevFundBps: data.creatorDevFundBps ?? current.creatorDevFundBps,
    };
    this.validateRule({ ruleKey, ...updated });

    return this.prisma.revenueSplitRule.update({
      where: { ruleKey },
      data: {
        ...updated,
        updatedById: adminUserId,
      },
    });
  }

  /** Compute party amounts from DB rule (basis points). */
  calculateDistribution(
    rule: {
      creatorBps: number;
      platformBps: number;
      gafBps: number;
      creatorDevFundBps: number;
    },
    grossUsd: Prisma.Decimal | number | string,
  ): SplitAllocation[] {
    const gross = new Prisma.Decimal(grossUsd);
    const parties = [
      { party: RevenueParty.creator, bps: rule.creatorBps },
      { party: RevenueParty.platform, bps: rule.platformBps },
      { party: RevenueParty.gaf, bps: rule.gafBps },
      { party: RevenueParty.creator_dev_fund, bps: rule.creatorDevFundBps },
    ].filter((p) => p.bps > 0);

    const allocations: SplitAllocation[] = [];
    let assigned = new Prisma.Decimal(0);

    for (let i = 0; i < parties.length; i++) {
      const { party, bps } = parties[i];
      const isLast = i === parties.length - 1;
      const amount = isLast
        ? gross.minus(assigned)
        : gross.mul(bps).div(10000).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      assigned = assigned.plus(amount);
      allocations.push({ party, amountUsd: amount });
    }

    return allocations;
  }

  async distributeAndPersist(params: {
    ruleKey: string;
    sourceType: RevenueSourceType;
    sourceId: string;
    grossAmountUsd: Prisma.Decimal | number | string;
    creatorId?: string;
    metadata?: Prisma.InputJsonValue;
    recordGafInflow?: boolean;
  }) {
    const rule = await this.getRule(params.ruleKey);
    const gross = new Prisma.Decimal(params.grossAmountUsd);
    const allocations = this.calculateDistribution(rule, gross);

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.revenueLedgerBatch.create({
        data: {
          ruleKey: params.ruleKey,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          grossAmountUsd: gross,
          creatorId: params.creatorId,
          metadata: params.metadata ?? undefined,
        },
      });

      await tx.revenueLedgerEntry.createMany({
        data: allocations.map((a) => ({
          batchId: batch.id,
          party: a.party,
          amountUsd: a.amountUsd,
        })),
      });

      const gafAmount = allocations.find((a) => a.party === RevenueParty.gaf)?.amountUsd;
      if (params.recordGafInflow !== false && gafAmount && gafAmount.gt(0)) {
        await tx.gafLedgerEntry.create({
          data: {
            direction: 'inflow',
            source: this.gafSourceForRevenueType(params.sourceType),
            amountUsd: gafAmount,
            revenueBatchId: batch.id,
          },
        });
      }

      const creatorCredit = allocations.find(
        (a) => a.party === RevenueParty.creator,
      )?.amountUsd;
      if (params.creatorId && creatorCredit && creatorCredit.gt(0)) {
        await tx.creatorBalanceLedger.create({
          data: {
            creatorId: params.creatorId,
            entryType: 'credit',
            amountUsd: creatorCredit,
            batchId: batch.id,
            description: `${params.sourceType} via ${params.ruleKey}`,
          },
        });
      }

      return { batch, allocations };
    });
  }

  private gafSourceForRevenueType(sourceType: RevenueSourceType) {
    switch (sourceType) {
      case RevenueSourceType.ad_impression:
        return 'advertising';
      case RevenueSourceType.sponsorship:
        return 'sponsorship';
      case RevenueSourceType.store_order:
      case RevenueSourceType.ticket:
        return 'marketplace';
      case RevenueSourceType.insider_membership:
      case RevenueSourceType.platform_subscription:
      case RevenueSourceType.creator_subscription:
        return 'membership';
      case RevenueSourceType.donation:
        return 'donation';
      default:
        return 'viewer_support';
    }
  }

  private validateRule(rule: {
    ruleKey: string;
    creatorBps: number;
    platformBps: number;
    gafBps: number;
    creatorDevFundBps: number;
  }) {
    const sum =
      rule.creatorBps +
      rule.platformBps +
      rule.gafBps +
      rule.creatorDevFundBps;
    if (sum !== 10000) {
      throw new BadRequestException(
        `Revenue split rule "${rule.ruleKey}" must total 10000 basis points (100%), got ${sum}`,
      );
    }
  }
}
