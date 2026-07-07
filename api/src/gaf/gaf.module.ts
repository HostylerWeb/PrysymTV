import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GafController } from './gaf.controller';
import { GafService } from './gaf.service';

@Module({
  imports: [PrismaModule],
  controllers: [GafController],
  providers: [GafService],
  exports: [GafService],
})
export class GafModule {}
