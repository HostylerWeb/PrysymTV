import { resolveAvatarUrl } from '@/lib/media-url';
import type { NotificationMetadata } from '@/lib/notification-target';
import { resolveNotificationNavTarget } from '@/lib/notification-target';

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
  actorUsername?: string;
  navTarget?: ReturnType<typeof resolveNotificationNavTarget>;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function mapNotificationToListItem(n: ApiNotification): NotificationListItem {
  const actorName =
    n.actor?.displayName || n.actor?.username?.replace(/^@/, '') || 'Prysym TV';
  const avatar = n.actor
    ? resolveAvatarUrl(n.actor.avatarUrl, n.actor.username)
    : resolveAvatarUrl(null, 'system');

  let message = n.message;
  if (n.actor && message.startsWith(actorName)) {
    message = message.slice(actorName.length).trim();
  }

  return {
    id: n.id,
    type: n.type,
    user: n.type === 'system' ? 'Prysym TV' : actorName,
    message: n.type === 'system' ? n.message : message || n.message,
    time: timeAgo(n.createdAt),
    isRead: n.isRead,
    avatar,
    actorUsername: n.actor?.username,
    navTarget: resolveNotificationNavTarget(
      n.type,
      n.referenceId,
      n.metadata,
      n.actor?.username,
    ),
  };
}
