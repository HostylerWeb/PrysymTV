import { apiRequest } from "@/lib/api-client";
import type { ApiNotification } from "@/lib/map-notifications";

export type NotificationPreference = {
  type: string;
  enabled: boolean;
};

export type NotificationsListResponse = {
  items: ApiNotification[];
  meta: { page: number; limit: number; total: number };
};

export function fetchNotificationPreferences() {
  return apiRequest<NotificationPreference[]>("/users/me/notification-preferences");
}

export function updateNotificationPreference(type: string, enabled: boolean) {
  return apiRequest<NotificationPreference>("/users/me/notification-preferences", {
    method: "PUT",
    body: { type, enabled },
  });
}

export function fetchNotifications(page = 1, limit = 40) {
  return apiRequest<NotificationsListResponse>(
    `/users/me/notifications?page=${page}&limit=${limit}`,
  );
}

export function markNotificationRead(id: string) {
  return apiRequest<{ success: boolean }>(`/users/me/notifications/${id}/read`, {
    method: "PUT",
  });
}

export function markAllNotificationsRead() {
  return apiRequest<{ success: boolean }>("/users/me/notifications/read-all", {
    method: "PUT",
  });
}

export function clearAllNotifications() {
  return apiRequest<{ success: boolean }>("/users/me/notifications", {
    method: "DELETE",
  });
}
