export type LiveBroadcastPlayerProps = {
  webrtcUrl?: string | null;
  hlsUrl?: string | null;
  posterUrl?: string | null;
  contentFit?: 'contain' | 'cover' | 'fill';
  paused?: boolean;
  autoPlay?: boolean;
  isLive?: boolean;
};
