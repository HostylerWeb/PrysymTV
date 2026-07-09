import { completeMobileCheckout } from '@/lib/stripe-checkout';
import type { CheckoutResult } from '@/lib/api/billing';

export async function runBillingCheckout(
  result: CheckoutResult,
  onFulfilled?: () => void | Promise<void>,
): Promise<{ ok: boolean; error?: string }> {
  if (result.devMode || result.coinsAdded != null || result.premiumTier || result.insiderActive) {
    await onFulfilled?.();
    return { ok: true };
  }
  const checkout = await completeMobileCheckout(result);
  if (checkout.ok) await onFulfilled?.();
  return checkout;
}
