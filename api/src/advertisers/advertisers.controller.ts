import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { AdvertisersService } from './advertisers.service';

@Controller('advertisers')
@UseGuards(JwtAuthGuard)
export class AdvertisersController {
  constructor(private readonly advertisers: AdvertisersService) {}

  @Post('register')
  register(
    @CurrentUser() user: AuthUserPayload,
    @Body()
    body: { companyName: string; contactEmail: string; billingEmail?: string },
  ) {
    if (!body.companyName?.trim() || !body.contactEmail?.trim()) {
      throw new BadRequestException('companyName and contactEmail required');
    }
    return this.advertisers.register(user.id, body);
  }

  @Get('me')
  listMine(@CurrentUser() user: AuthUserPayload) {
    return this.advertisers.listMine(user.id);
  }

  @Get('me/:id')
  getMine(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.advertisers.getMine(user.id, id);
  }
}
