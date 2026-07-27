import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  resolveNotificationNavTargetFromPushData,
  type NotificationNavTarget,
  type PushNotificationData,
} from '@/lib/notification-target';

function navigateToTarget(router: ReturnType<typeof useRouter>, target: NotificationNavTarget) {
  if (typeof target === 'string') {
    router.push(target as never);
    return;
  }
  router.push(target as never);
}

function handleNotificationResponse(
  router: ReturnType<typeof useRouter>,
  response: Notifications.NotificationResponse,
) {
  const data = response.notification.request.content.data as PushNotificationData;
  const target = resolveNotificationNavTargetFromPushData(data);
  if (!target) return;
  navigateToTarget(router, target);
  void Notifications.clearLastNotificationResponseAsync();
}

export function PushNotificationSetup() {
  const router = useRouter();

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(router, response);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(router, response);
    });

    return () => {
      responseSub.remove();
    };
  }, [router]);

  return null;
}
