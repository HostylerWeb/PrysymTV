import { Controller, Get, Param } from '@nestjs/common';

@Controller('playlists')
export class PlaylistsController {
  @Get(':id')
  getOne(@Param('id') id: string) {
    return { id, items: [], message: 'Week 3' };
  }
}
