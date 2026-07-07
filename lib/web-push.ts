import {
  fetchPushConfig,
  registerPushSubscription,
  unregisterPushSubscription,
} from "@/lib/api/push";

const SW_PATH = "/push-sw.js";

export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_PATH, { scope: "/" });
}

async function getVapidPublicKey(): Promise<string> {
  const config = await fetchPushConfig();
  if (!config.enabled || !config.publicKey) {
    throw new Error("Browser push is not configured on the server.");
  }
  return config.publicKey;
}

export async function subscribeToWebPush(): Promise<PushSubscription> {
  if (!isWebPushSupported()) {
    throw new Error("This browser does not support push notifications.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was denied.");
  }

  const publicKey = await getVapidPublicKey();
  const registration = await getServiceWorkerRegistration();
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Invalid push subscription from browser.");
  }

  await registerPushSubscription({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    expirationTime: json.expirationTime ?? null,
  });

  return subscription;
}

export async function unsubscribeFromWebPush(): Promise<void> {
  if (!isWebPushSupported()) return;

  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await unregisterPushSubscription(endpoint).catch(() => {
    /* server may already have removed it */
  });
}

export async function syncWebPushSubscription(): Promise<boolean> {
  if (!isWebPushSupported()) return false;
  if (Notification.permission !== "granted") return false;

  try {
    await subscribeToWebPush();
    return true;
  } catch {
    return false;
  }
}
