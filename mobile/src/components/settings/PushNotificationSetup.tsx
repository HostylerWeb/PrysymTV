import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import {
  NOTIFICATIONS_QUERY_KEY,
} from '@/hooks/api/useNotifications';
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
  const queryClient = useQueryClient();

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(router, response);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(router, response);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [queryClient, router]);

  return null;
}
