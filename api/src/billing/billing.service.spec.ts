import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RevenueSplitService } from '../revenue/revenue-split.service';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  let service: BillingService;
  const prisma = {
    transaction: { findFirst: jest.fn(), updateMany: jest.fn() },
    user: { findUnique: jest.fn() },
    coinPackage: { findUnique: jest.fn() },
  };
  const revenueSplit = { distributeAndPersist: jest.fn() };
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return undefined;
      if (key === 'FRONTEND_URL') return 'http://localhost:3001';
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prisma },
        { provide: RevenueSplitService, useValue: revenueSplit },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(BillingService);
  });

  describe('fulfillCheckoutSession', () => {
    it('throws when Stripe is not configured', async () => {
      await expect(service.fulfillCheckoutSession('cs_test')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('idempotent fulfillment marker', () => {
    it('returns alreadyFulfilled when transaction completed', async () => {
      (service as unknown as { stripe: object }).stripe = {
        checkout: {
          sessions: {
            retrieve: jest.fn().mockResolvedValue({
              id: 'cs_test',
              payment_status: 'paid',
              metadata: { userId: 'u1', productType: 'coins', packageId: 'pkg1' },
            }),
          },
        },
      };
      prisma.transaction.findFirst.mockResolvedValue({
        id: 'tx1',
        status: TransactionStatus.completed,
      });
      prisma.user.findUnique.mockResolvedValue({
        coinsBalance: 100,
        premiumTier: 'none',
        premiumExpiresAt: null,
      });

      const result = await service.fulfillCheckoutSession('cs_test', 'u1');
      expect(result.alreadyFulfilled).toBe(true);
      expect(result.coinsBalance).toBe(100);
    });

    it('rejects when session userId does not match caller', async () => {
      (service as unknown as { stripe: object }).stripe = {
        checkout: {
          sessions: {
            retrieve: jest.fn().mockResolvedValue({
              id: 'cs_test',
              payment_status: 'paid',
              metadata: { userId: 'other-user', productType: 'coins' },
            }),
          },
        },
      };
      prisma.transaction.findFirst.mockResolvedValue(null);

      await expect(
        service.fulfillCheckoutSession('cs_test', 'u1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
