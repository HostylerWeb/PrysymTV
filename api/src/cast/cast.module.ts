import { Module } from '@nestjs/common';
import { CastController } from './cast.controller';
import { CastService } from './cast.service';

@Module({
  controllers: [CastController],
  providers: [CastService],
})
export class CastModule {}
