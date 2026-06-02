import { Controller, Get, Param } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlists: PlaylistsService) {}

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.playlists.getOne(id);
  }
}
