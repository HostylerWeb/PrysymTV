import { io, type Socket } from 'socket.io-client';
import { ensureAccessToken, loadStoredAccessToken } from './client';
import { getWsUrl } from './config';

export type StreamChatMessage = {
  id: string;
  streamId: string;
  userId: string;
  user: string;
  message: string;
  color: string;
  createdAt: string;
  type?: 'message' | 'gift';
  giftId?: string;
  giftName?: string;
  giftIcon?: string;
  coins?: number;
};

export type StreamGiftEvent = {
  id: string;
  streamId: string;
  userId: string;
  user: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  coins: number;
  color: string;
  createdAt: string;
};

export async function connectStreamChat(streamId: string) {
  const token = (await loadStoredAccessToken()) ?? (await ensureAccessToken());

  const socket: Socket = io(`${getWsUrl()}/streams`, {
    transports: ['websocket'],
    auth: { token: token ?? undefined },
  });

  return new Promise<{ socket: Socket; history: StreamChatMessage[] }>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chat connection timeout')), 8000);

    socket.on('connect', () => {
      socket.emit('join', { streamId });
    });

    socket.on('history', (history: StreamChatMessage[]) => {
      clearTimeout(timeout);
      resolve({ socket, history });
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
