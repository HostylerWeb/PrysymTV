import { Controller, Get, Param } from '@nestjs/common';
import { ProgramsService } from './programs.service';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  @Get()
  list() {
    return this.programs.list();
  }

  @Get(':slug')
  hub(@Param('slug') slug: string) {
    return this.programs.getHub(slug);
  }
}
