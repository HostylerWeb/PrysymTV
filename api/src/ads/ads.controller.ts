import { Body, Controller, Get, Post, Query } from '@nestjs/common';

@Controller('ads')
export class AdsController {
  @Get('serve')
  serve(@Query('placement') placement?: string) {
    return { placement, ad: null, message: 'Week 8' };
  }

  @Post('track/impression')
  trackImpression(@Body() _body: { campaignId: string }) {
    return { success: true };
  }

  @Post('track/click')
  trackClick(@Body() _body: { campaignId: string }) {
    return { success: true };
  }
}
