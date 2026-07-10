import type { User } from "@/contexts/auth-context";
import type { MeResponse } from "@/lib/api/types";
import { isInsiderActive } from "@/lib/insider";
import { userAvatarUrl, profileBannerUrl } from "@/lib/user-avatar";

export function mapMeToUser(me: MeResponse): User {
  const status = me.streamerStatus;
  const verticalStatus = me.verticalCreatorStatus ?? "none";
  return {
    id: me.id,
    role: me.role,
    name: me.displayName || me.username,
    username: me.username.startsWith("@") ? me.username : `@${me.username}`,
    email: me.email,
    avatar: userAvatarUrl(me.avatarUrl, me.username),
    bannerUrl: profileBannerUrl(me.bannerUrl),
    bio: me.bio ?? "",
    coins: me.coinsBalance,
    premiumTier: me.premiumTier ?? "none",
    premiumExpiresAt: me.premiumExpiresAt,
    insiderActive: isInsiderActive(me.insiderActive, me.insiderPeriodEnd),
    insiderPeriodEnd: me.insiderPeriodEnd ?? null,
    isStreamer: status === "approved",
    streamerStatus: status,
    isVerticalCreator: verticalStatus === "approved",
    verticalCreatorStatus: verticalStatus,
    storeCreatorStatus: me.storeCreatorStatus ?? "none",
    followersCount: me.followersCount,
    followingCount: me.followingCount,
    videosCount: me.videosCount,
    gender: me.gender ?? null,
    birthDate: me.birthDate ?? null,
  };
}
