import type {
  CreatorStoreSummary,
  PublicStoreProduct,
  SellerStoreProduct,
} from '@/types/api';
import { normalizeUsernameSlug } from '@/lib/username-slug';
import { apiRequest } from './client';
import { uploadPickedFile } from './profile-upload';

type StoreImageUploadInit = {
  storeId: string;
  objectKey: string;
  uploadUrl: string;
  uploadMethod: 'PUT' | 'POST';
  uploadHeaders: Record<string, string>;
  expiresIn: number;
  publicUrl: string;
};

export type StoreCheckoutResult = {
  checkoutUrl?: string;
  sessionId?: string;
  orderId: string;
  devMode?: boolean;
  redirectUrl?: string;
  success?: boolean;
};

export function fetchMyStore() {
  return apiRequest<{ store: CreatorStoreSummary; products: SellerStoreProduct[] }>(
    '/stores/me',
  );
}

export function fetchCreatorStore(username: string) {
  const slug = normalizeUsernameSlug(username);
  return apiRequest<{
    store: CreatorStoreSummary;
    creatorUsername: string;
    products: PublicStoreProduct[];
  }>(`/users/${encodeURIComponent(slug)}/store`, { auth: false });
}

export function fetchStoreProduct(username: string, productId: string) {
  const slug = normalizeUsernameSlug(username);
  return apiRequest<{
    store: CreatorStoreSummary;
    creatorUsername: string;
    product: PublicStoreProduct;
  }>(`/users/${encodeURIComponent(slug)}/store/products/${productId}`, { auth: false });
}

export function updateMyStore(body: {
  displayName?: string;
  description?: string;
  shippingFree?: boolean;
  shippingFeeUsd?: number;
}) {
  return apiRequest<CreatorStoreSummary>('/stores/me', {
    method: 'PUT',
    body,
  });
}

export function createMyStoreProduct(body: {
  productType: 'merchandise' | 'digital';
  title: string;
  description?: string;
  priceUsd: number;
  imageUrl: string;
  galleryUrls?: string[];
  digitalUrl?: string;
  inventory?: number;
  inventoryUnlimited?: boolean;
}) {
  return apiRequest<SellerStoreProduct>('/stores/me/products', {
    method: 'POST',
    body,
  });
}

export function deleteMyStoreProduct(id: string) {
  return apiRequest<{ success: boolean }>(`/stores/me/products/${id}`, {
    method: 'DELETE',
  });
}

export function updateMyStoreProduct(
  id: string,
  body: {
    title?: string;
    description?: string;
    priceUsd?: number;
    imageUrl?: string;
    galleryUrls?: string[];
    digitalUrl?: string | null;
    inventory?: number | null;
    inventoryUnlimited?: boolean;
    status?: 'active' | 'draft' | 'archived';
  },
) {
  return apiRequest<SellerStoreProduct>(`/stores/me/products/${id}`, {
    method: 'PUT',
    body,
  });
}

export function createStoreCheckout(
  productId: string,
  quantity = 1,
  options?: {
    shippingAddress?: {
      fullName: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      countryCode: string;
    };
    saveBuyerDetails?: boolean;
  },
) {
  return createStoreCartCheckout([{ productId, quantity }], options);
}

export function createStoreCartCheckout(
  items: Array<{ productId: string; quantity: number }>,
  options?: {
    shippingAddress?: {
      fullName: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      countryCode: string;
    };
    saveBuyerDetails?: boolean;
  },
) {
  return apiRequest<StoreCheckoutResult>('/stores/checkout', {
    method: 'POST',
    body: {
      items,
      ...options,
    },
  });
}

export function fetchStoreOrder(orderId: string) {
  return apiRequest<{
    id: string;
    status: string;
    totalUsd: number;
    createdAt: string;
    store: { displayName: string; slug: string };
    lines: Array<{
      quantity: number;
      unitUsd: number;
      product: {
        id: string;
        title: string;
        productType: string;
        imageUrl: string | null;
        digitalUrl: string | null;
      };
    }>;
  }>(`/stores/orders/${orderId}`);
}

export async function uploadStoreProductImage(file: {
  uri: string;
  mimeType?: string | null;
  name?: string | null;
}): Promise<string> {
  const mimeType = file.mimeType?.trim().startsWith('image/') ? file.mimeType : 'image/jpeg';
  const fileName = file.name || 'product.jpg';
  const init = await apiRequest<StoreImageUploadInit>(
    '/stores/me/products/images/upload/init',
    {
      method: 'POST',
      body: { mimeType, fileName },
    },
  );
  await uploadPickedFile(init, file);
  const done = await apiRequest<{ imageUrl: string }>(
    '/stores/me/products/images/upload/complete',
    { method: 'POST', body: { objectKey: init.objectKey } },
  );
  return done.imageUrl;
}

export function stockLabel(
  product: Pick<PublicStoreProduct, 'productType' | 'inventory' | 'inventoryUnlimited' | 'inStock'>,
) {
  if (product.productType === 'digital') return 'Digital download';
  if (product.inventoryUnlimited) return 'In stock';
  if (!product.inStock) return 'Out of stock';
  return `${product.inventory} in stock`;
}

export function shippingLabel(
  product: Pick<PublicStoreProduct, 'productType' | 'shippingFree' | 'shippingFeeUsd'>,
) {
  if (product.productType !== 'merchandise') return null;
  if (product.shippingFree !== false) return 'Free shipping';
  const fee = product.shippingFeeUsd ?? 0;
  return fee > 0 ? `Shipping: $${fee.toFixed(2)}` : 'Paid shipping';
}
