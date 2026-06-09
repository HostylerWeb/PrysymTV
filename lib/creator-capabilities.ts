import type { User } from "@/contexts/auth-context";

export type CreatorCapabilityId =
  | "shorts"
  | "videos"
  | "podcasts"
  | "verticals"
  | "live";

export type CreatorCapability = {
  id: CreatorCapabilityId;
  label: string;
  allowed: boolean;
  pending: boolean;
  description: string;
};

export function isIdentityVerified(user: User | null): boolean {
  return user?.streamerStatus === "approved";
}

export function getCreatorCapabilities(user: User | null): CreatorCapability[] {
  if (!user) {
    return [];
  }

  return [
    {
      id: "shorts",
      label: "Shorts",
      allowed: true,
      pending: false,
      description: "Vertical clips under 60 seconds",
    },
    {
      id: "videos",
      label: "Long videos",
      allowed: true,
      pending: false,
      description: "Long-form horizontal videos",
    },
    {
      id: "podcasts",
      label: "Podcasts",
      allowed: true,
      pending: false,
      description: "Shows and audio episodes",
    },
    {
      id: "verticals",
      label: "Vertical series",
      allowed: user.isVerticalCreator,
      pending: user.verticalCreatorStatus === "pending",
      description: "Micro-drama episodic series",
    },
    {
      id: "live",
      label: "Live streaming",
      allowed: user.streamerStatus === "approved",
      pending: user.streamerStatus === "pending",
      description: "Broadcast live with OBS",
    },
  ];
}

export function lockedCapabilities(user: User | null): CreatorCapability[] {
  return getCreatorCapabilities(user).filter((c) => !c.allowed);
}

export function hasLockedCapabilities(user: User | null): boolean {
  return lockedCapabilities(user).length > 0;
}
