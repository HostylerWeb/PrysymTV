import { apiRequest } from "@/lib/api-client";
import { withApiFallback } from "@/lib/api/fallback";
import { GIFT_CATALOG } from "@/lib/mock-data";

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
};

export function fetchCoinPackages() {
  return withApiFallback(
    () => apiRequest<CoinPackage[]>("/billing/products", { auth: false }),
    [
      { id: "starter", coins: 100, priceUsd: "0.99", label: "Starter" },
      { id: "popular", coins: 500, priceUsd: "3.99", label: "Popular" },
    ],
  );
}

export function fetchGiftCatalog() {
  return withApiFallback(
    () => apiRequest<GiftCatalogItem[]>("/billing/gifts/catalog", { auth: false }),
    GIFT_CATALOG.map((g) => ({
      id: g.id,
      name: g.name,
      coinCost: g.cost,
      animationKey: g.id,
    })),
  );
}

export function createCoinCheckout(packageId: string) {
  return apiRequest<{
    checkoutUrl?: string;
    devMode?: boolean;
    coinsAdded?: number;
    coinsBalance?: number;
    sessionId?: string;
  }>("/billing/stripe/create-checkout", {
    method: "POST",
    body: { packageId, productType: "coins" },
  });
}

export function fulfillCoinCheckout(sessionId: string) {
  return apiRequest<{ success: boolean; coinsBalance: number }>(
    `/billing/stripe/fulfill?session_id=${encodeURIComponent(sessionId)}`,
  );
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
