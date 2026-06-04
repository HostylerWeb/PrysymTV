import type { User } from "@/contexts/auth-context";
import type { MeResponse } from "@/lib/api/types";
import { userAvatarUrl } from "@/lib/user-avatar";

export function mapMeToUser(me: MeResponse): User {
  const status = me.streamerStatus;
  return {
    id: me.id,
    name: me.displayName || me.username,
    username: me.username.startsWith("@") ? me.username : `@${me.username}`,
    email: me.email,
    avatar: userAvatarUrl(me.avatarUrl, me.username),
    bannerUrl: me.bannerUrl,
    bio: me.bio ?? "",
    coins: me.coinsBalance,
    premiumTier: me.premiumTier ?? "none",
    premiumExpiresAt: me.premiumExpiresAt,
    isStreamer: status === "approved",
    streamerStatus: status,
    followersCount: me.followersCount,
    followingCount: me.followingCount,
    videosCount: me.videosCount,
  };
}
