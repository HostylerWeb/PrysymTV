import { apiRequest } from './client';
import type { PaginatedMeta } from '@/types/api';
import type { ApiNotification } from '@/lib/map-notifications';

export type NotificationPreference = {
  type: string;
  enabled: boolean;
};

export function fetchNotificationPreferences() {
  return apiRequest<NotificationPreference[]>('/users/me/notification-preferences');
}

export function updateNotificationPreference(type: string, enabled: boolean) {
  return apiRequest<NotificationPreference>('/users/me/notification-preferences', {
    method: 'PUT',
    body: { type, enabled },
  });
}

export function fetchNotifications(page = 1, limit = 40) {
  return apiRequest<{ items: ApiNotification[]; meta: PaginatedMeta }>(
    `/users/me/notifications?page=${page}&limit=${limit}`,
  );
}

export function markNotificationRead(id: string) {
  return apiRequest<unknown>(`/users/me/notifications/${id}/read`, { method: 'PUT' });
}

export function markAllNotificationsRead() {
  return apiRequest<unknown>('/users/me/notifications/read-all', { method: 'PUT' });
}

export function clearNotifications() {
  return apiRequest<unknown>('/users/me/notifications', { method: 'DELETE' });
}
