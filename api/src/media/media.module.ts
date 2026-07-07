import { Module } from '@nestjs/common';
import { MediaAssetsController } from './media-assets.controller';
import { MediaController } from './media.controller';

@Module({
  controllers: [MediaController, MediaAssetsController],
})
export class MediaModule {}
