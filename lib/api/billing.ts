import { apiRequest } from "@/lib/api-client";
import { withApiFallback } from "@/lib/api/fallback";

export type CoinPackage = {
  id: string;
  coins: number;
  priceUsd: number | string;
  label: string;
};

export type GiftCatalogItem = {
  id: string;
  name: string;
  coinCost: number;
  animationKey: string;
  imageUrl?: string | null;
};

export function fetchCoinPackages() {
  return withApiFallback(
    () => apiRequest<CoinPackage[]>("/billing/products", { auth: false }),
    [],
  );
}

export function fetchGiftCatalog() {
  return withApiFallback(
    () => apiRequest<GiftCatalogItem[]>("/billing/gifts/catalog", { auth: false }),
    [],
  );
}

export type CheckoutResult = {
  checkoutUrl?: string;
  devMode?: boolean;
  coinsAdded?: number;
  coinsBalance?: number;
  premiumTier?: string;
  premiumExpiresAt?: string | null;
  insiderActive?: boolean;
  insiderPeriodEnd?: string | null;
  sessionId?: string;
  success?: boolean;
};

export function createCoinCheckout(packageId: string) {
  return apiRequest<CheckoutResult>("/billing/stripe/create-checkout", {
    method: "POST",
    body: { packageId, productType: "coins" },
  });
}

export function createPremiumCheckout(tierId: string) {
  return apiRequest<CheckoutResult>("/billing/stripe/create-checkout", {
    method: "POST",
    body: { packageId: tierId, productType: "premium" },
  });
}

export function createInsiderCheckout() {
  return apiRequest<CheckoutResult>("/billing/stripe/create-checkout", {
    method: "POST",
    body: { packageId: "insider", productType: "insider" },
  });
}

export function fulfillCheckout(sessionId: string) {
  return apiRequest<CheckoutResult>(
    `/billing/stripe/fulfill?session_id=${encodeURIComponent(sessionId)}`,
  );
}

/** @deprecated Use fulfillCheckout */
export function fulfillCoinCheckout(sessionId: string) {
  return fulfillCheckout(sessionId);
}

export function sendGift(body: {
  giftId: string;
  receiverId: string;
  streamId?: string;
  videoId?: string;
}) {
  return apiRequest<{
    success: boolean;
    coinsSpent: number;
    coinsRemaining: number;
  }>("/billing/gifts/send", { method: "POST", body, auth: true });
}
