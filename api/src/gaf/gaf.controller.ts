import { Controller, Get } from '@nestjs/common';
import { GafService } from './gaf.service';

@Controller('gaf')
export class GafController {
  constructor(private readonly gaf: GafService) {}

  /** Public transparency summary — no auth required. */
  @Get('public')
  publicTransparency() {
    return this.gaf.publicTransparency();
  }
}
