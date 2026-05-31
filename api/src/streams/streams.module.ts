import { Module } from '@nestjs/common';
import { StreamsController } from './streams.controller';

@Module({ controllers: [StreamsController] })
export class StreamsModule {}
