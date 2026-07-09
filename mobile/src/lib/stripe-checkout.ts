import * as WebBrowser from 'expo-web-browser';
import { fulfillCheckout } from '@/lib/api/billing';
import { fetchStoreOrder } from '@/lib/api/stores';

export type MobileCheckoutPayload = {
  checkoutUrl?: string;
  sessionId?: string;
  orderId?: string;
  devMode?: boolean;
  redirectUrl?: string;
  success?: boolean;
};

export async function completeMobileCheckout(
  payload: MobileCheckoutPayload,
): Promise<{ ok: boolean; error?: string }> {
  if (payload.devMode || payload.success) {
    return { ok: true };
  }

  if (payload.checkoutUrl && payload.sessionId) {
    await WebBrowser.openBrowserAsync(payload.checkoutUrl);
    try {
      await fulfillCheckout(payload.sessionId);
      return { ok: true };
    } catch {
      if (payload.orderId) {
        try {
          const order = await fetchStoreOrder(payload.orderId);
          if (order.status === 'paid' || order.status === 'fulfilled' || order.status === 'completed') {
            return { ok: true };
          }
        } catch {
          /* ignore */
        }
      }
      return {
        ok: false,
        error: 'Payment may still be processing. Check your profile orders.',
      };
    }
  }

  return { ok: false, error: 'Could not start checkout' };
}
