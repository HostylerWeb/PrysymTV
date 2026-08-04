export type LiveBroadcastPlayerProps = {
  webrtcUrl?: string | null;
  hlsUrl?: string | null;
  posterUrl?: string | null;
  contentFit?: 'contain' | 'cover' | 'fill';
  paused?: boolean;
  autoPlay?: boolean;
  isLive?: boolean;
  /** Fill parent (immersive fullscreen) instead of fixed 16:9 box. */
  immersive?: boolean;
};
