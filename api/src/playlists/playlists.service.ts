import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOne(id: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
      include: {
        creator: { select: { username: true, displayName: true, avatarUrl: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');
    return playlist;
  }
}
