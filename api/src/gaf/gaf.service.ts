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

  async publicTransparency() {
    const [programs, inflow, outflow, outflowByCategory, recentGrants] =
      await Promise.all([
        this.prisma.gafProgram.findMany({
          where: { isActive: true },
          orderBy: [{ category: 'asc' }, { title: 'asc' }],
          select: {
            id: true,
            category: true,
            title: true,
            description: true,
          },
        }),
        this.prisma.gafLedgerEntry.aggregate({
          where: { direction: 'inflow' },
          _sum: { amountUsd: true },
        }),
        this.prisma.gafLedgerEntry.aggregate({
          where: { direction: 'outflow' },
          _sum: { amountUsd: true },
        }),
        this.prisma.gafLedgerEntry.groupBy({
          by: ['programCategory'],
          where: { direction: 'outflow', programCategory: { not: null } },
          _sum: { amountUsd: true },
        }),
        this.prisma.gafLedgerEntry.findMany({
          where: { direction: 'outflow' },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            amountUsd: true,
            programCategory: true,
            description: true,
            createdAt: true,
            gafProgram: { select: { title: true } },
          },
        }),
      ]);

    const totalInflowUsd = Number(inflow._sum.amountUsd ?? 0);
    const totalOutflowUsd = Number(outflow._sum.amountUsd ?? 0);

    return {
      programs,
      summary: {
        totalInflowUsd,
        totalOutflowUsd,
        balanceUsd: totalInflowUsd - totalOutflowUsd,
      },
      fundingByCategory: outflowByCategory.map((row) => ({
        category: row.programCategory,
        amountUsd: Number(row._sum.amountUsd ?? 0),
      })),
      recentGrants: recentGrants.map((row) => ({
        id: row.id,
        amountUsd: Number(row.amountUsd),
        category: row.programCategory,
        programTitle: row.gafProgram?.title ?? null,
        description: row.description,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }
}
