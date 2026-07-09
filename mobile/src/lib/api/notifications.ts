import { apiRequest } from './client';
import type { PaginatedMeta } from '@/types/api';

export function fetchNotifications(page = 1, limit = 24) {
  return apiRequest<{ items: unknown[]; meta: PaginatedMeta }>(
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
