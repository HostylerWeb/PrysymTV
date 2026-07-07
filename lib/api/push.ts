import { apiRequest } from "@/lib/api-client";

export type PushConfig = {
  enabled: boolean;
  publicKey: string | null;
};

export type PushSubscriptionStatus = {
  subscribed: boolean;
  enabled: boolean;
};

export function fetchPushConfig() {
  return apiRequest<PushConfig>("/push/vapid-public-key", { auth: false });
}

export function fetchPushSubscriptionStatus() {
  return apiRequest<PushSubscriptionStatus>("/users/me/push-subscription");
}

export function registerPushSubscription(body: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
}) {
  return apiRequest<{ id: string }>("/users/me/push-subscription", {
    method: "POST",
    body,
  });
}

export function unregisterPushSubscription(endpoint: string) {
  return apiRequest<{ success: boolean }>("/users/me/push-subscription", {
    method: "DELETE",
    body: { endpoint },
  });
}
