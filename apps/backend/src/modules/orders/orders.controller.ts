import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MARKETPLACE_ROLES, type Order } from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { CancelOrderDto, CompleteOrderDto, PayOrderDto } from './dto/order-action.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Oturumdaki tarafın siparişlerini listeler' })
  @ApiOkResponse({ description: 'Sayfalı sipariş listesi' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOrdersQueryDto,
  ): Promise<PaginatedResult<Order>> {
    return this.orders.listMine(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tek bir siparişi getirir' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Order> {
    return this.orders.getById(user, id);
  }

  @Post(':id/pay')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Siparişin ödemesini tamamlar' })
  pay(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayOrderDto,
  ): Promise<Order> {
    return this.orders.pay(user, id, dto);
  }

  @Post(':id/start')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Satıcı işe başladığını bildirir' })
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Order> {
    return this.orders.start(user, id);
  }

  @Post(':id/complete')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Satıcı işi tamamlar ve onaya gönderir' })
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteOrderDto,
  ): Promise<Order> {
    return this.orders.complete(user, id, dto);
  }

  @Post(':id/approve')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Müşteri işi onaylar ve hakedişi serbest bırakır' })
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Order> {
    return this.orders.approve(user, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Siparişi iptal eder' })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ): Promise<Order> {
    return this.orders.cancel(user, id, dto);
  }
}
