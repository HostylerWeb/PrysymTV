import { formatDistanceToNow } from "date-fns";
import { userAvatarUrl } from "@/lib/user-avatar";
import {
  buildNotificationActionUrl,
  type NotificationMetadata,
} from "@/lib/notification-target";

export type ApiNotification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  referenceId: string | null;
  metadata?: NotificationMetadata | null;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
};

export type NotificationListItem = {
  id: string;
  type: string;
  user: string;
  message: string;
  time: string;
  isRead: boolean;
  avatar: string;
  actionUrl?: string;
};

export function mapNotificationToListItem(n: ApiNotification): NotificationListItem {
  const actorName =
    n.actor?.displayName || n.actor?.username?.replace(/^@/, "") || "Prysym TV";
  const avatar = n.actor
    ? userAvatarUrl(n.actor.avatarUrl, n.actor.username)
    : userAvatarUrl(null, "system");

  let message = n.message;
  if (n.actor && n.message.startsWith(actorName)) {
    message = n.message.slice(actorName.length).trim();
  }

  return {
    id: n.id,
    type: n.type,
    user: n.type === "system" ? "Prysym TV" : actorName,
    message: n.type === "system" ? n.message : message || n.message,
    time: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }),
    isRead: n.isRead,
    avatar,
    actionUrl: buildNotificationActionUrl(
      n.type,
      n.referenceId,
      n.metadata,
      n.actor?.username,
    ),
  };
}
