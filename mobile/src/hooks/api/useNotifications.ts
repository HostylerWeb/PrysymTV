import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clearNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import { mapNotificationToListItem, type NotificationListItem } from '@/lib/map-notifications';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
export const NOTIFICATIONS_POLL_MS = 15_000;

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    enabled,
    queryFn: async (): Promise<NotificationListItem[]> => {
      const res = await fetchNotifications(1, 40);
      return res.items.map(mapNotificationToListItem);
    },
    refetchInterval: enabled ? NOTIFICATIONS_POLL_MS : false,
    refetchIntervalInBackground: true,
  });
}

export function useUnreadNotificationCount(enabled = true) {
  const query = useNotifications(enabled);
  const unread = (query.data ?? []).filter((n) => !n.isRead).length;
  return { ...query, unread };
}

export function useNotificationActions() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

  return {
    markRead: async (id: string) => {
      await markNotificationRead(id);
      invalidate();
    },
    markAllRead: async () => {
      await markAllNotificationsRead();
      invalidate();
    },
    clearAll: async () => {
      await clearNotifications();
      invalidate();
    },
  };
}
