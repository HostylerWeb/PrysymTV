import { Global, Module } from '@nestjs/common';
import { ContentServicesService } from './content-services.service';

@Global()
@Module({
  providers: [ContentServicesService],
  exports: [ContentServicesService],
})
export class ContentServicesModule {}
