import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GafService } from './gaf.service';

@Module({
  imports: [PrismaModule],
  providers: [GafService],
  exports: [GafService],
})
export class GafModule {}
