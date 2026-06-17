import { apiRequest } from "@/lib/api-client";

export type CreatorBalance = {
  availableUsd: string;
  minimumPayoutUsd: string;
  lifetimeCreditsUsd: string;
  pendingPayouts: Array<{
    id: string;
    amountUsd: string;
    status: string;
    method: string;
    createdAt: string;
  }>;
};

export type CreatorSubscription = {
  id: string;
  tier: string;
  status: string;
  currentPeriodEnd: string;
  creator: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
};

export type SubscriptionCheckoutResult = {
  checkoutUrl?: string;
  sessionId?: string;
  devMode?: boolean;
  success?: boolean;
  subscriptionId?: string;
  currentPeriodEnd?: string;
};

export function fetchCreatorBalance() {
  return apiRequest<CreatorBalance>("/billing/creators/balance");
}

export type CreatorPayoutMethod = "paypal" | "bank_transfer" | "crypto";

export type CreatorPayoutProfile =
  | { configured: false }
  | {
      configured: true;
      method: CreatorPayoutMethod;
      details: Record<string, string>;
      updatedAt: string;
    };

export function fetchCreatorPayoutProfile() {
  return apiRequest<CreatorPayoutProfile>("/billing/creators/payout-profile");
}

export function saveCreatorPayoutProfile(body: {
  method: CreatorPayoutMethod;
  details: Record<string, string>;
}) {
  return apiRequest<Extract<CreatorPayoutProfile, { configured: true }>>(
    "/billing/creators/payout-profile",
    { method: "PUT", body },
  );
}

export function requestCreatorPayout(body: { amountUsd: number }) {
  return apiRequest<{
    success: boolean;
    payout: {
      id: string;
      amountUsd: string;
      status: string;
      method: string;
      createdAt: string;
    };
    balance: CreatorBalance;
  }>("/billing/creators/payouts/request", {
    method: "POST",
    body,
  });
}

export function fetchMyCreatorSubscriptions() {
  return apiRequest<{ items: CreatorSubscription[] }>("/billing/subscriptions/me");
}

export function createCreatorSubscriptionCheckout(
  creatorId: string,
  tier: "basic" | "premium" = "basic",
) {
  return apiRequest<SubscriptionCheckoutResult>("/billing/subscriptions/create", {
    method: "POST",
    body: { creatorId, tier },
  });
}

export function cancelCreatorSubscription(subscriptionId: string) {
  return apiRequest<{ success: boolean; status: string }>(
    `/billing/subscriptions/${subscriptionId}`,
    { method: "DELETE" },
  );
}
