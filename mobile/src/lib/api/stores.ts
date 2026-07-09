import { apiRequest } from './client';

export function fetchCreatorStore(username: string) {
  return apiRequest<Record<string, unknown>>(`/users/${username}/store`, { auth: false });
}

export function fetchStoreProduct(username: string, productId: string) {
  return apiRequest<Record<string, unknown>>(
    `/users/${username}/store/products/${productId}`,
    { auth: false },
  );
}

export function fetchMyStore() {
  return apiRequest<Record<string, unknown>>('/stores/me');
}

export function createStoreCheckout(body: Record<string, unknown>) {
  return apiRequest<{ checkoutUrl: string; sessionId?: string; orderId?: string }>(
    '/stores/checkout',
    { method: 'POST', body },
  );
}
