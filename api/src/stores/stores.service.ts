import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  StoreCreatorStatus,
  StoreOrderStatus,
  StoreProductStatus,
  StoreProductType,
  TransactionStatus,
  TransactionType,
  PaymentProvider,
  RevenueSourceType,
} from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeUsername } from '../common/utils/username.util';
import { RevenueSplitService } from '../revenue/revenue-split.service';
import { StorageService } from '../storage/storage.service';
import { CreateStoreCheckoutDto } from './dto/create-store-checkout.dto';
import { CreateStoreProductDto } from './dto/create-store-product.dto';
import { UpdateCreatorStoreDto } from './dto/update-creator-store.dto';
import { UpdateStoreProductDto } from './dto/update-store-product.dto';

@Injectable()
export class StoresService {
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly revenueSplit: RevenueSplitService,
    private readonly storage: StorageService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key) this.stripe = new Stripe(key);
  }

  private assertStoreApproved(userId: string, status: StoreCreatorStatus) {
    if (status !== StoreCreatorStatus.approved) {
      throw new ForbiddenException(
        'Creator Store access is not approved yet. Request it from your profile.',
      );
    }
  }

  private resolveMerchandiseInventory(dto: {
    inventory?: number;
    inventoryUnlimited?: boolean;
  }): { inventory: number | null; inventoryUnlimited: boolean } {
    if (dto.inventoryUnlimited) {
      return { inventory: null, inventoryUnlimited: true };
    }
    if (dto.inventory === undefined || dto.inventory < 1) {
      throw new BadRequestException(
        'Physical products need stock of at least 1, or enable unlimited stock',
      );
    }
    return { inventory: dto.inventory, inventoryUnlimited: false };
  }

  private isInStock(product: {
    productType: StoreProductType;
    inventory: number | null;
    inventoryUnlimited: boolean;
  }): boolean {
    if (product.productType === StoreProductType.digital) return true;
    if (product.inventoryUnlimited) return true;
    return (product.inventory ?? 0) > 0;
  }

  private async ensureStore(creatorId: string, username: string, displayName: string | null) {
    const existing = await this.prisma.creatorStore.findUnique({
      where: { creatorId },
    });
    if (existing) return existing;

    const baseSlug = normalizeUsername(username).replace(/[^a-z0-9-]/g, '-');
    let slug = baseSlug;
    let n = 0;
    while (await this.prisma.creatorStore.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${baseSlug}-${n}`;
    }

    return this.prisma.creatorStore.create({
      data: {
        creatorId,
        slug,
        displayName: displayName?.trim() || username,
        isPublished: true,
      },
    });
  }

  async getMyStore(userId: string, storeCreatorStatus: StoreCreatorStatus) {
    this.assertStoreApproved(userId, storeCreatorStatus);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const store = await this.ensureStore(userId, user.username, user.displayName);
    const products = await this.prisma.storeProduct.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      store: this.mapStore(store),
      products: products.map((p) => this.mapProduct(p)),
    };
  }

  async updateMyStore(
    userId: string,
    storeCreatorStatus: StoreCreatorStatus,
    dto: UpdateCreatorStoreDto,
  ) {
    this.assertStoreApproved(userId, storeCreatorStatus);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const store = await this.ensureStore(userId, user.username, user.displayName);
    const storeData: Prisma.CreatorStoreUpdateInput = {
      ...(dto.displayName !== undefined && {
        displayName: dto.displayName.trim(),
      }),
      ...(dto.description !== undefined && {
        description: dto.description.trim() || null,
      }),
    };
    if (dto.shippingFree !== undefined) {
      storeData.shippingFree = dto.shippingFree;
      if (dto.shippingFree) storeData.shippingFeeUsd = 0;
    }
    if (dto.shippingFeeUsd !== undefined && dto.shippingFree !== true) {
      storeData.shippingFeeUsd = dto.shippingFeeUsd;
    }
    const updated = await this.prisma.creatorStore.update({
      where: { id: store.id },
      data: storeData,
    });
    return this.mapStore(updated);
  }

  async createProduct(
    userId: string,
    storeCreatorStatus: StoreCreatorStatus,
    dto: CreateStoreProductDto,
  ) {
    this.assertStoreApproved(userId, storeCreatorStatus);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    if (dto.productType === StoreProductType.digital && !dto.digitalUrl?.trim()) {
      throw new BadRequestException('digitalUrl is required for digital products');
    }
    if (dto.productType !== StoreProductType.merchandise && dto.productType !== StoreProductType.digital) {
      throw new BadRequestException('Only merchandise and digital products are supported');
    }

    const store = await this.ensureStore(userId, user.username, user.displayName);
    const stock =
      dto.productType === StoreProductType.merchandise
        ? this.resolveMerchandiseInventory(dto)
        : { inventory: null, inventoryUnlimited: false };

    const product = await this.prisma.storeProduct.create({
      data: {
        storeId: store.id,
        productType: dto.productType,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        priceUsd: dto.priceUsd,
        imageUrl: dto.imageUrl,
        galleryUrls: dto.galleryUrls ?? [],
        digitalUrl:
          dto.productType === StoreProductType.digital
            ? dto.digitalUrl!.trim()
            : null,
        inventory: stock.inventory,
        inventoryUnlimited: stock.inventoryUnlimited,
        status: StoreProductStatus.active,
        revenueRuleKey: 'store_merchandise',
      },
    });
    return this.mapProduct(product);
  }

  async initProductImageUpload(
    userId: string,
    storeCreatorStatus: StoreCreatorStatus,
    mimeType: string,
    fileName?: string,
  ) {
    this.assertStoreApproved(userId, storeCreatorStatus);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const store = await this.ensureStore(
      userId,
      user.username,
      user.displayName,
    );
    this.storage.assertImageMime(mimeType);
    const objectKey = this.storage.buildStoreProductImageKey(
      store.id,
      fileName,
    );
    const base = this.storage.getSettings().apiPublicUrl.replace(/\/$/, '');
    return {
      storeId: store.id,
      objectKey,
      uploadUrl: `${base}/media/store-product-image-upload`,
      uploadMethod: 'POST' as const,
      uploadHeaders: {},
      expiresIn: this.storage.getSettings().presignExpiresSeconds,
      publicUrl: this.storage.getPublicUrl(objectKey),
    };
  }

  async completeProductImageUpload(
    userId: string,
    storeCreatorStatus: StoreCreatorStatus,
    objectKey: string,
  ) {
    this.assertStoreApproved(userId, storeCreatorStatus);
    const store = await this.prisma.creatorStore.findUnique({
      where: { creatorId: userId },
    });
    if (!store) throw new NotFoundException('Store not found');

    const key = objectKey.replace(/^\/+/, '');
    const expectedPrefix = `uploads/stores/${store.id}/images/`;
    if (!key.startsWith(expectedPrefix)) {
      throw new BadRequestException('Invalid store product image key');
    }

    const exists = await this.storage.objectExists(key);
    if (!exists) {
      throw new BadRequestException(
        'Image not found. Finish uploading the file first.',
      );
    }

    const imageUrl = this.storage.getPublicUrl(key);
    return { storeId: store.id, objectKey: key, imageUrl };
  }

  async updateProduct(
    userId: string,
    storeCreatorStatus: StoreCreatorStatus,
    productId: string,
    dto: UpdateStoreProductDto,
  ) {
    this.assertStoreApproved(userId, storeCreatorStatus);
    const store = await this.prisma.creatorStore.findUnique({
      where: { creatorId: userId },
    });
    if (!store) throw new NotFoundException('Store not found');

    const existing = await this.prisma.storeProduct.findFirst({
      where: { id: productId, storeId: store.id },
    });
    if (!existing) throw new NotFoundException('Product not found');

    const productType = dto.productType ?? existing.productType;
    let inventory = existing.inventory;
    let inventoryUnlimited = existing.inventoryUnlimited;

    if (productType === StoreProductType.merchandise) {
      if (dto.inventoryUnlimited !== undefined) {
        inventoryUnlimited = dto.inventoryUnlimited;
        if (inventoryUnlimited) inventory = null;
      }
      if (dto.inventory !== undefined && !inventoryUnlimited) {
        if (dto.inventory === null || dto.inventory < 1) {
          throw new BadRequestException(
            'inventory must be at least 1, or enable unlimited stock',
          );
        }
        inventory = dto.inventory;
      }
      if (!inventoryUnlimited && (inventory === null || inventory < 1)) {
        throw new BadRequestException(
          'inventory must be at least 1, or enable unlimited stock',
        );
      }
    }

    const product = await this.prisma.storeProduct.update({
      where: { id: productId },
      data: {
        ...(dto.productType !== undefined && { productType: dto.productType }),
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description.trim() || null,
        }),
        ...(dto.priceUsd !== undefined && { priceUsd: dto.priceUsd }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.galleryUrls !== undefined && { galleryUrls: dto.galleryUrls }),
        ...(dto.digitalUrl !== undefined && { digitalUrl: dto.digitalUrl }),
        inventory,
        inventoryUnlimited,
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
    return this.mapProduct(product);
  }

  async deleteProduct(
    userId: string,
    storeCreatorStatus: StoreCreatorStatus,
    productId: string,
  ) {
    this.assertStoreApproved(userId, storeCreatorStatus);
    const store = await this.prisma.creatorStore.findUnique({
      where: { creatorId: userId },
    });
    if (!store) throw new NotFoundException('Store not found');

    const existing = await this.prisma.storeProduct.findFirst({
      where: { id: productId, storeId: store.id },
    });
    if (!existing) throw new NotFoundException('Product not found');

    await this.prisma.storeProduct.delete({ where: { id: productId } });
    return { success: true };
  }

  async getPublicStoreByUsername(username: string) {
    const user = await this.prisma.user.findFirst({
      where: { username: normalizeUsername(username), isBanned: false },
      select: {
        username: true,
        storeCreatorStatus: true,
        creatorStore: {
          include: {
            products: {
              where: { status: StoreProductStatus.active },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
    if (
      !user ||
      user.storeCreatorStatus !== StoreCreatorStatus.approved ||
      !user.creatorStore ||
      !user.creatorStore.isPublished
    ) {
      throw new NotFoundException('Store not found');
    }

    return {
      store: this.mapStore(user.creatorStore),
      creatorUsername: user.username,
      products: user.creatorStore.products.map((p) => this.mapPublicProduct(p)),
    };
  }

  async getPublicProduct(username: string, productId: string) {
    const data = await this.getPublicStoreByUsername(username);
    const product = data.products.find((p) => p.id === productId);
    if (!product) throw new NotFoundException('Product not found');
    return {
      store: data.store,
      creatorUsername: data.creatorUsername,
      product: {
        ...product,
        shippingFree: data.store.shippingFree,
        shippingFeeUsd: data.store.shippingFeeUsd,
      },
    };
  }

  async createCheckout(buyerId: string, dto: CreateStoreCheckoutDto) {
    const requestedLines = dto.items?.length
      ? dto.items
      : dto.productId
        ? [{ productId: dto.productId, quantity: dto.quantity ?? 1 }]
        : [];

    if (!requestedLines.length) {
      throw new BadRequestException('At least one product is required');
    }

    const mergedQuantities = new Map<string, number>();
    for (const line of requestedLines) {
      mergedQuantities.set(
        line.productId,
        (mergedQuantities.get(line.productId) ?? 0) + line.quantity,
      );
    }

    const productIds = [...mergedQuantities.keys()];
    const products = await this.prisma.storeProduct.findMany({
      where: { id: { in: productIds } },
      include: {
        store: {
          include: {
            creator: { select: { id: true, username: true, isBanned: true } },
          },
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('Product not found');
    }

    const storeId = products[0].storeId;
    const store = products[0].store;
    if (products.some((p) => p.storeId !== storeId)) {
      throw new BadRequestException('All items must be from the same store');
    }
    if (!store.isPublished || store.creator.isBanned) {
      throw new NotFoundException('Store not found');
    }
    if (store.creatorId === buyerId) {
      throw new BadRequestException('You cannot buy your own products');
    }

    const orderLines: Array<{ product: (typeof products)[number]; quantity: number; unitUsd: number }> =
      [];

    for (const product of products) {
      if (product.status !== StoreProductStatus.active) {
        throw new NotFoundException('Product not found');
      }
      const quantity = mergedQuantities.get(product.id) ?? 0;
      if (!this.isInStock(product)) {
        throw new BadRequestException(`${product.title} is out of stock`);
      }
      if (
        product.productType === StoreProductType.merchandise &&
        !product.inventoryUnlimited &&
        product.inventory != null &&
        quantity > product.inventory
      ) {
        throw new BadRequestException(`Not enough stock for ${product.title}`);
      }
      orderLines.push({
        product,
        quantity,
        unitUsd: Number(product.priceUsd),
      });
    }

    const hasPhysical = orderLines.some(
      (line) => line.product.productType === StoreProductType.merchandise,
    );
    if (hasPhysical && !dto.shippingAddress) {
      throw new BadRequestException('Shipping address is required for physical products');
    }

    const shippingFeeUsd = hasPhysical
      ? store.shippingFree
        ? 0
        : Number(store.shippingFeeUsd)
      : 0;

    const subtotalUsd = orderLines.reduce(
      (sum, line) => sum + line.unitUsd * line.quantity,
      0,
    );
    const totalUsd = subtotalUsd + shippingFeeUsd;
    const frontend = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const creatorUsername = store.creator.username;
    const isMultiItem = orderLines.length > 1 || orderLines[0].quantity > 1;
    const checkoutBase = isMultiItem
      ? `${frontend}/creator/${creatorUsername}/store/cart`
      : `${frontend}/creator/${creatorUsername}/store/${orderLines[0].product.id}`;

    if (dto.saveBuyerDetails && dto.shippingAddress) {
      await this.saveBuyerDetails(buyerId, dto.shippingAddress);
    }

    const order = await this.prisma.storeOrder.create({
      data: {
        storeId,
        buyerId,
        status: StoreOrderStatus.pending,
        totalUsd,
        shippingFeeUsd,
        shippingSnapshot: dto.shippingAddress
          ? (JSON.parse(JSON.stringify(dto.shippingAddress)) as Prisma.InputJsonValue)
          : undefined,
        lines: {
          create: orderLines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            unitUsd: line.unitUsd,
          })),
        },
      },
    });

    if (!this.stripe) {
      if (this.config.get<string>('BILLING_DEV_GRANTS') === 'true') {
        await this.fulfillStoreOrder(order.id, `dev-store-${order.id}`);
        return {
          success: true,
          devMode: true,
          orderId: order.id,
          redirectUrl: `${checkoutBase}?checkout=success&order=${order.id}`,
        };
      }
      throw new ServiceUnavailableException(
        'Store checkout requires Stripe. Set STRIPE_SECRET_KEY in the API environment.',
      );
    }

    const lineItems = orderLines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(line.unitUsd * 100),
        product_data: {
          name: line.product.title,
          description: line.product.description?.slice(0, 200) ?? undefined,
          images: line.product.imageUrl ? [line.product.imageUrl] : undefined,
        },
      },
    }));
    if (shippingFeeUsd > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(shippingFeeUsd * 100),
          product_data: {
            name: 'Shipping',
            description: `Shipping from ${store.displayName}`,
            images: undefined,
          },
        },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${checkoutBase}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${checkoutBase}?checkout=cancelled`,
      metadata: {
        userId: buyerId,
        productType: 'store',
        orderId: order.id,
        storeId,
        itemCount: String(orderLines.length),
      },
      line_items: lineItems,
    });

    await this.prisma.storeOrder.update({
      where: { id: order.id },
      data: { providerRef: session.id },
    });

    return { checkoutUrl: session.url, sessionId: session.id, orderId: order.id };
  }

  async fulfillStoreOrder(orderId: string, stripeSessionId: string) {
    const order = await this.prisma.storeOrder.findUnique({
      where: { id: orderId },
      include: {
        lines: { include: { product: true } },
        store: { include: { creator: { select: { id: true } } } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === StoreOrderStatus.paid) {
      return { success: true, alreadyFulfilled: true, orderId: order.id };
    }

    await this.prisma.$transaction(async (tx) => {
      for (const line of order.lines) {
        const p = line.product;
        if (
          p.productType === StoreProductType.merchandise &&
          !p.inventoryUnlimited &&
          p.inventory != null
        ) {
          if (p.inventory < line.quantity) {
            throw new BadRequestException('Insufficient stock during fulfillment');
          }
          await tx.storeProduct.update({
            where: { id: p.id },
            data: { inventory: p.inventory - line.quantity },
          });
        }
      }

      await tx.storeOrder.update({
        where: { id: orderId },
        data: {
          status: StoreOrderStatus.paid,
          providerRef: stripeSessionId,
        },
      });

      const existingTx = await tx.transaction.findFirst({
        where: { providerTransactionId: stripeSessionId },
      });
      if (!existingTx) {
        const txRow = await tx.transaction.create({
          data: {
            userId: order.buyerId,
            type: TransactionType.purchase_coins,
            provider: PaymentProvider.stripe,
            providerTransactionId: stripeSessionId,
            amountUsd: order.totalUsd,
            status: TransactionStatus.completed,
          },
        });
        await this.revenueSplit.distributeAndPersist({
          ruleKey: 'store_merchandise',
          sourceType: RevenueSourceType.store_order,
          sourceId: txRow.id,
          grossAmountUsd: Number(order.totalUsd),
          creatorId: order.store.creator.id,
          metadata: { orderId: order.id, storeId: order.storeId, kind: 'store_order' },
        });
      }
    });

    return { success: true, orderId: order.id };
  }

  async getBuyerOrder(buyerId: string, orderId: string) {
    const order = await this.prisma.storeOrder.findFirst({
      where: { id: orderId, buyerId },
      include: {
        lines: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                productType: true,
                imageUrl: true,
                digitalUrl: true,
              },
            },
          },
        },
        store: { select: { displayName: true, slug: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    return {
      id: order.id,
      status: order.status,
      totalUsd: Number(order.totalUsd),
      shippingFeeUsd: Number(order.shippingFeeUsd),
      createdAt: order.createdAt.toISOString(),
      store: order.store,
      lines: order.lines.map((l) => ({
        quantity: l.quantity,
        unitUsd: Number(l.unitUsd),
        product: {
          id: l.product.id,
          title: l.product.title,
          productType: l.product.productType,
          imageUrl: l.product.imageUrl,
          digitalUrl:
            order.status === StoreOrderStatus.paid &&
            l.product.productType === StoreProductType.digital
              ? l.product.digitalUrl
              : null,
        },
      })),
    };
  }

  private mapPublicProduct(product: {
    id: string;
    productType: StoreProductType;
    title: string;
    description: string | null;
    priceUsd: { toString(): string } | number | string;
    imageUrl: string | null;
    galleryUrls: string[];
    inventory: number | null;
    inventoryUnlimited: boolean;
    createdAt: Date;
  }) {
    return {
      id: product.id,
      productType: product.productType,
      title: product.title,
      description: product.description,
      priceUsd: Number(product.priceUsd),
      imageUrl: product.imageUrl,
      galleryUrls: product.galleryUrls,
      inventory: product.inventory,
      inventoryUnlimited: product.inventoryUnlimited,
      inStock: this.isInStock(product),
      createdAt: product.createdAt.toISOString(),
    };
  }

  private async saveBuyerDetails(
    userId: string,
    address: {
      fullName: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      countryCode: string;
    },
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        buyerFullName: address.fullName.trim(),
        buyerPhone: address.phone.trim(),
        buyerAddressLine1: address.line1.trim(),
        buyerAddressLine2: address.line2?.trim() || null,
        buyerCity: address.city.trim(),
        buyerState: address.state?.trim() || null,
        buyerPostalCode: address.postalCode.trim(),
        buyerCountryCode: address.countryCode.trim().toUpperCase(),
      },
    });
  }

  private mapStore(store: {
    id: string;
    slug: string;
    displayName: string;
    description: string | null;
    bannerUrl: string | null;
    shippingFree: boolean;
    shippingFeeUsd: { toString(): string } | number | string;
    isPublished: boolean;
    createdAt: Date;
  }) {
    return {
      id: store.id,
      slug: store.slug,
      displayName: store.displayName,
      description: store.description,
      bannerUrl: store.bannerUrl,
      shippingFree: store.shippingFree,
      shippingFeeUsd: Number(store.shippingFeeUsd),
      isPublished: store.isPublished,
      createdAt: store.createdAt.toISOString(),
    };
  }

  private mapProduct(product: {
    id: string;
    productType: StoreProductType;
    title: string;
    description: string | null;
    priceUsd: { toString(): string } | number | string;
    imageUrl: string | null;
    galleryUrls: string[];
    digitalUrl: string | null;
    inventory: number | null;
    inventoryUnlimited: boolean;
    status: StoreProductStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: product.id,
      productType: product.productType,
      title: product.title,
      description: product.description,
      priceUsd: Number(product.priceUsd),
      imageUrl: product.imageUrl,
      galleryUrls: product.galleryUrls,
      digitalUrl: product.digitalUrl,
      inventory: product.inventory,
      inventoryUnlimited: product.inventoryUnlimited,
      status: product.status,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
