import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  connectStreamChat,
  type StreamChatMessage,
  type StreamGiftEvent,
} from '@/lib/api/stream-chat';

export function useStreamChat(streamId: string | undefined) {
  const [messages, setMessages] = useState<StreamChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!streamId) return;
    let cancelled = false;

    void connectStreamChat(streamId)
      .then(({ socket, history }) => {
        if (cancelled) {
          socket.disconnect();
          return;
        }
        socketRef.current = socket;
        setMessages(history);
        setConnected(true);
        setError(null);

        socket.on('message', (msg: StreamChatMessage) => {
          setMessages((prev) => [...prev, msg]);
        });

        socket.on('gift', (gift: StreamGiftEvent) => {
          setMessages((prev) => [
            ...prev,
            {
              id: gift.id,
              streamId: gift.streamId,
              userId: gift.userId,
              user: gift.user,
              message: `sent ${gift.giftName}`,
              color: gift.color,
              createdAt: gift.createdAt,
              type: 'gift',
              giftId: gift.giftId,
              giftName: gift.giftName,
              giftIcon: gift.giftIcon,
              coins: gift.coins,
            },
          ]);
        });

        socket.on('streamEnded', () => setConnected(false));
        socket.on('disconnect', () => setConnected(false));
        socket.on('viewers', (payload: { count?: number }) => {
          if (typeof payload?.count === 'number') {
            setViewerCount(payload.count);
          }
        });
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message ?? 'Chat unavailable');
          setConnected(false);
        }
      });

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [streamId]);

  const sendMessage = (message: string) => {
    const text = message.trim();
    if (!text || !streamId || !socketRef.current) return false;
    socketRef.current.emit('message', { streamId, message: text });
    return true;
  };

  return { messages, connected, viewerCount, error, sendMessage };
}
