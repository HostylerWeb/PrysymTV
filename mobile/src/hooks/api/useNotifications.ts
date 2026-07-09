import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clearNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import { mapNotificationToListItem, type NotificationListItem } from '@/lib/map-notifications';

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ['notifications'],
    enabled,
    queryFn: async (): Promise<NotificationListItem[]> => {
      const res = await fetchNotifications(1, 40);
      return res.items.map(mapNotificationToListItem);
    },
  });
}

export function useUnreadNotificationCount(enabled = true) {
  const query = useNotifications(enabled);
  const unread = (query.data ?? []).filter((n) => !n.isRead).length;
  return { ...query, unread };
}

export function useNotificationActions() {
  const queryClient = useQueryClient();

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['notifications'] });

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
