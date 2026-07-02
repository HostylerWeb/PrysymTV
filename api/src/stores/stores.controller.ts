import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { StoreCreatorStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreProductDto } from './dto/create-store-product.dto';
import { UpdateCreatorStoreDto } from './dto/update-creator-store.dto';
import { UpdateStoreProductDto } from './dto/update-store-product.dto';
import { StoresService } from './stores.service';

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(
    private readonly stores: StoresService,
    private readonly prisma: PrismaService,
  ) {}

  private async storeStatus(userId: string): Promise<StoreCreatorStatus> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { storeCreatorStatus: true },
    });
    return user?.storeCreatorStatus ?? StoreCreatorStatus.none;
  }

  @Get('me')
  async getMine(@CurrentUser() user: AuthUserPayload) {
    const status = await this.storeStatus(user.id);
    return this.stores.getMyStore(user.id, status);
  }

  @Put('me')
  async updateMine(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: UpdateCreatorStoreDto,
  ) {
    const status = await this.storeStatus(user.id);
    return this.stores.updateMyStore(user.id, status, body);
  }

  @Post('me/products')
  async createProduct(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: CreateStoreProductDto,
  ) {
    const status = await this.storeStatus(user.id);
    return this.stores.createProduct(user.id, status, body);
  }

  @Put('me/products/:id')
  async updateProduct(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateStoreProductDto,
  ) {
    const status = await this.storeStatus(user.id);
    return this.stores.updateProduct(user.id, status, id, body);
  }

  @Delete('me/products/:id')
  async deleteProduct(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
  ) {
    const status = await this.storeStatus(user.id);
    return this.stores.deleteProduct(user.id, status, id);
  }
}
