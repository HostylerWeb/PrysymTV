import { apiRequest } from "@/lib/api-client";

export type PublicAdsConfig = {
  shortsInterstitialEveryNSwipes: number;
  shortsInterstitialEnabled: boolean;
  shortsSkipSeconds: number;
  moviePrerollSkipSeconds: number;
  placements: {
    home_banner: boolean;
    shorts_interstitial: boolean;
    movie_preroll: boolean;
    vertical_episode: boolean;
  };
};

export function fetchPublicConfig() {
  return apiRequest<{ ads: PublicAdsConfig }>("/config/public", { auth: false });
}
