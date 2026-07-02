import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  StoreCreatorStatus,
  StoreProductStatus,
  StoreProductType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreProductDto } from './dto/create-store-product.dto';
import { UpdateCreatorStoreDto } from './dto/update-creator-store.dto';
import { UpdateStoreProductDto } from './dto/update-store-product.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  private assertStoreApproved(userId: string, status: StoreCreatorStatus) {
    if (status !== StoreCreatorStatus.approved) {
      throw new ForbiddenException(
        'Creator Store access is not approved yet. Request it from your profile.',
      );
    }
  }

  private async ensureStore(creatorId: string, username: string, displayName: string | null) {
    const existing = await this.prisma.creatorStore.findUnique({
      where: { creatorId },
    });
    if (existing) return existing;

    const baseSlug = username.toLowerCase().replace(/[^a-z0-9-]/g, '-');
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
    const updated = await this.prisma.creatorStore.update({
      where: { id: store.id },
      data: {
        ...(dto.displayName !== undefined && {
          displayName: dto.displayName.trim(),
        }),
        ...(dto.description !== undefined && {
          description: dto.description.trim() || null,
        }),
      },
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
    if (
      dto.productType === StoreProductType.merchandise &&
      dto.inventory === undefined
    ) {
      throw new BadRequestException('inventory is required for physical products');
    }

    const store = await this.ensureStore(userId, user.username, user.displayName);
    const product = await this.prisma.storeProduct.create({
      data: {
        storeId: store.id,
        productType: dto.productType,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        priceUsd: dto.priceUsd,
        imageUrl: dto.imageUrl,
        digitalUrl:
          dto.productType === StoreProductType.digital
            ? dto.digitalUrl!.trim()
            : null,
        inventory:
          dto.productType === StoreProductType.merchandise
            ? dto.inventory!
            : null,
        status: StoreProductStatus.active,
        revenueRuleKey: 'store_merchandise',
      },
    });
    return this.mapProduct(product);
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
        ...(dto.digitalUrl !== undefined && { digitalUrl: dto.digitalUrl }),
        ...(dto.inventory !== undefined && { inventory: dto.inventory }),
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
      where: { username: username.toLowerCase(), isBanned: false },
      select: {
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
      products: user.creatorStore.products.map((p) => this.mapPublicProduct(p)),
    };
  }

  private mapPublicProduct(product: {
    id: string;
    productType: StoreProductType;
    title: string;
    description: string | null;
    priceUsd: { toString(): string } | number | string;
    imageUrl: string | null;
    inventory: number | null;
    createdAt: Date;
  }) {
    return {
      id: product.id,
      productType: product.productType,
      title: product.title,
      description: product.description,
      priceUsd: Number(product.priceUsd),
      imageUrl: product.imageUrl,
      inventory: product.inventory,
      createdAt: product.createdAt.toISOString(),
    };
  }

  private mapStore(store: {
    id: string;
    slug: string;
    displayName: string;
    description: string | null;
    bannerUrl: string | null;
    isPublished: boolean;
    createdAt: Date;
  }) {
    return {
      id: store.id,
      slug: store.slug,
      displayName: store.displayName,
      description: store.description,
      bannerUrl: store.bannerUrl,
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
    digitalUrl: string | null;
    inventory: number | null;
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
      digitalUrl: product.digitalUrl,
      inventory: product.inventory,
      status: product.status,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
