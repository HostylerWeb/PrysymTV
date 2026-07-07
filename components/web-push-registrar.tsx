"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { syncWebPushSubscription, isWebPushSupported } from "@/lib/web-push";
import { fetchPushSubscriptionStatus } from "@/lib/api/push";

/** Re-syncs an existing browser push subscription after login. */
export function WebPushRegistrar() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !isWebPushSupported()) return;
    if (Notification.permission !== "granted") return;

    void fetchPushSubscriptionStatus()
      .then((status) => {
        if (status.subscribed) return;
        return syncWebPushSubscription();
      })
      .catch(() => {
        /* ignore */
      });
  }, [user?.id]);

  return null;
}
