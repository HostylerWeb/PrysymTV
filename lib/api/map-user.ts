import type { User } from "@/contexts/auth-context";
import type { MeResponse } from "@/lib/api/types";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";

export function mapMeToUser(me: MeResponse): User {
  const status = me.streamerStatus;
  return {
    id: me.id,
    name: me.displayName || me.username,
    username: me.username.startsWith("@") ? me.username : `@${me.username}`,
    email: me.email,
    avatar: me.avatarUrl || DEFAULT_AVATAR,
    bio: me.bio ?? "",
    coins: me.coinsBalance,
    isStreamer: status === "approved",
    streamerStatus: status,
    followersCount: me.followersCount,
    followingCount: me.followingCount,
    videosCount: me.videosCount,
  };
}
