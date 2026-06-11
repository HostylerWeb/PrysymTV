import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createdAtFilter } from '../admin/admin-date-range.util';

@Injectable()
export class GafService {
  constructor(private readonly prisma: PrismaService) {}

  async ledger(query: {
    page?: number;
    limit?: number;
    direction?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const where: Prisma.GafLedgerEntryWhereInput = {};
    if (query.direction === 'inflow' || query.direction === 'outflow') {
      where.direction = query.direction;
    }
    const createdAt = createdAtFilter(query);
    if (createdAt) where.createdAt = createdAt;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.gafLedgerEntry.count({ where }),
      this.prisma.gafLedgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const inflow = await this.prisma.gafLedgerEntry.aggregate({
      where: { ...where, direction: 'inflow' },
      _sum: { amountUsd: true },
    });
    const outflow = await this.prisma.gafLedgerEntry.aggregate({
      where: { ...where, direction: 'outflow' },
      _sum: { amountUsd: true },
    });

    return {
      items,
      meta: { page, limit, total },
      summary: {
        totalInflowUsd: Number(inflow._sum.amountUsd ?? 0),
        totalOutflowUsd: Number(outflow._sum.amountUsd ?? 0),
        balanceUsd:
          Number(inflow._sum.amountUsd ?? 0) - Number(outflow._sum.amountUsd ?? 0),
      },
    };
  }
}
