import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { AddPlaylistItemDto } from './dto/add-playlist-item.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { ReorderPlaylistDto } from './dto/reorder-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PlaylistsService } from './playlists.service';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlists: PlaylistsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: AuthUserPayload) {
    return this.playlists.listMine(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUserPayload, @Body() body: CreatePlaylistDto) {
    return this.playlists.create(user.id, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: UpdatePlaylistDto,
  ) {
    return this.playlists.update(user.id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.playlists.remove(user.id, id);
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard)
  addItem(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: AddPlaylistItemDto,
  ) {
    return this.playlists.addItem(user.id, id, body);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(JwtAuthGuard)
  removeItem(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.playlists.removeItem(user.id, id, itemId);
  }

  @Put(':id/reorder')
  @UseGuards(JwtAuthGuard)
  reorder(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: ReorderPlaylistDto,
  ) {
    return this.playlists.reorder(user.id, id, body);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.playlists.getOne(id);
  }
}
