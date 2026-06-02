import { io, type Socket } from "socket.io-client";
import { getApiBaseUrl, loadStoredAccessToken } from "@/lib/api-client";

export type StreamChatMessage = {
  id: string;
  streamId: string;
  userId: string;
  user: string;
  message: string;
  color: string;
  createdAt: string;
};

export function connectStreamChat(streamId: string) {
  const base = getApiBaseUrl().replace(/\/api\/v1$/, "");
  const token = loadStoredAccessToken();

  const socket: Socket = io(`${base}/streams`, {
    transports: ["websocket"],
    auth: { token },
  });

  return new Promise<{ socket: Socket; history: StreamChatMessage[] }>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Chat connection timeout")), 8000);

    socket.on("connect", () => {
      socket.emit("join", { streamId }, () => {});
    });

    socket.on("history", (history: StreamChatMessage[]) => {
      clearTimeout(timeout);
      resolve({ socket, history });
    });

    socket.on("connect_error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
