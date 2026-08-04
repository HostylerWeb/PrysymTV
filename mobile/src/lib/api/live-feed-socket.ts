import { io, type Socket } from 'socket.io-client';
import { getWsUrl } from './config';

export type StreamLiveFeedEvent = {
  streamId: string;
  title: string;
  streamer: string;
  streamerSlug: string;
  streamerAvatar: string | null;
  thumbnailUrl: string | null;
  hlsPlaybackUrl: string | null;
  viewerCount: number;
  category: string | null;
  isPaid: boolean;
  entryCoinCost: number | null;
};

export type StreamEndedFeedEvent = { streamId: string };

type LiveFeedListener = (
  event: 'streamLive' | 'streamEnded',
  payload: StreamLiveFeedEvent | StreamEndedFeedEvent,
) => void;

let socket: Socket | null = null;
let refCount = 0;
const listeners = new Set<LiveFeedListener>();

function notify(
  event: 'streamLive' | 'streamEnded',
  payload: StreamLiveFeedEvent | StreamEndedFeedEvent,
) {
  listeners.forEach((listener) => listener(event, payload));
}

function ensureSocket() {
  if (socket) return;
  socket = io(`${getWsUrl()}/streams`, {
    transports: ['websocket'],
    autoConnect: true,
  });
  socket.on('connect', () => {
    socket?.emit('joinFeed', {});
  });
  socket.on('streamLive', (payload: StreamLiveFeedEvent) => {
    notify('streamLive', payload);
  });
  socket.on('streamEnded', (payload: StreamEndedFeedEvent) => {
    notify('streamEnded', payload);
  });
}

/** Shared feed socket — one connection per app, refcounted by subscribers. */
export function subscribeLiveFeed(listener: LiveFeedListener): () => void {
  refCount += 1;
  ensureSocket();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0) {
      socket?.disconnect();
      socket = null;
    }
  };
}
