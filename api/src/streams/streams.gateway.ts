import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

type StreamChatPayload = {
  id: string;
  streamId: string;
  userId: string;
  user: string;
  message: string;
  color: string;
  createdAt: string;
};

const CHAT_COLORS = [
  'text-cyan-400',
  'text-pink-400',
  'text-green-400',
  'text-yellow-400',
  'text-purple-400',
  'text-orange-400',
];

@WebSocketGateway({
  namespace: '/streams',
  cors: { origin: true, credentials: true },
})
export class StreamsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(StreamsGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers.authorization?.replace('Bearer ', '') as string);
      if (!token) {
        client.data.userId = null;
        return;
      }
      const payload = this.jwt.verify<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
    } catch {
      client.data.userId = null;
    }
  }

  async handleDisconnect(client: Socket) {
    const streamId = client.data.streamId as string | undefined;
    if (streamId) {
      await this.syncViewerCount(streamId);
    }
  }

  private async syncViewerCount(streamId: string) {
    const room = `stream:${streamId}`;
    const sockets = await this.server.in(room).fetchSockets();
    const count = sockets.length;
    try {
      await this.prisma.stream.update({
        where: { id: streamId },
        data: { viewerCount: count },
      });
    } catch {
      /* stream may have ended */
    }
    this.server.to(room).emit('viewers', { count });
  }

  @SubscribeMessage('join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { streamId: string },
  ) {
    const room = `stream:${body.streamId}`;
    await client.join(room);
    client.data.streamId = body.streamId;
    await this.syncViewerCount(body.streamId);

    const rows = await this.prisma.streamMessage.findMany({
      where: { streamId: body.streamId },
      orderBy: { createdAt: 'asc' },
      take: 80,
      include: {
        user: { select: { username: true, displayName: true } },
      },
    });

    const history: StreamChatPayload[] = rows.map((r, i) => ({
      id: r.id,
      streamId: r.streamId,
      userId: r.userId,
      user: r.user.displayName ?? r.user.username,
      message: r.message,
      color: CHAT_COLORS[i % CHAT_COLORS.length],
      createdAt: r.createdAt.toISOString(),
    }));

    client.emit('history', history);
    return { ok: true };
  }

  @SubscribeMessage('message')
  async message(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { streamId: string; message: string },
  ) {
    const userId = client.data.userId as string | null;
    if (!userId) {
      return { error: 'Authentication required' };
    }

    const text = body.message?.trim();
    if (!text) return { error: 'Empty message' };

    const stream = await this.prisma.stream.findUnique({
      where: { id: body.streamId },
    });
    if (!stream) return { error: 'Stream not found' };

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, displayName: true },
    });
    if (!user) return { error: 'User not found' };

    const saved = await this.prisma.streamMessage.create({
      data: {
        streamId: body.streamId,
        userId,
        message: text.slice(0, 500),
        timestampOffsetMs: 0,
      },
    });

    const payload: StreamChatPayload = {
      id: saved.id,
      streamId: saved.streamId,
      userId,
      user: user.displayName ?? user.username,
      message: saved.message,
      color: 'text-primary',
      createdAt: saved.createdAt.toISOString(),
    };

    this.server.to(`stream:${body.streamId}`).emit('message', payload);
    return { ok: true };
  }
}
