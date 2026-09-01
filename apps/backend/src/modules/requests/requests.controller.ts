import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Permission, type CommerceRequest, type RequestOffer } from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import {
  CreateCommerceRequestDto,
  CreateRequestOfferDto,
  ListRequestsQueryDto,
  NearbyRequestsQueryDto,
} from './dto/create-request.dto';
import { RequestsService } from './requests.service';

@ApiTags('Requests')
@ApiBearerAuth()
@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Post()
  @RequirePermissions(Permission.REQUEST_CREATE)
  @ApiOperation({ summary: 'Commerce talep oluşturur' })
  @ApiCreatedResponse({ description: 'Oluşturulan talep' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommerceRequestDto,
  ): Promise<CommerceRequest> {
    return this.requests.create(user, dto);
  }

  @Get('mine')
  @RequirePermissions(Permission.REQUEST_READ_OWN)
  @ApiOperation({ summary: 'Alıcının taleplerini listeler' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRequestsQueryDto,
  ): Promise<PaginatedResult<CommerceRequest>> {
    return this.requests.listMine(user, query);
  }

  @Get('matched')
  @RequirePermissions(Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'Tedarikçiye eşleşen talepleri listeler' })
  listMatched(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRequestsQueryDto,
  ): Promise<PaginatedResult<CommerceRequest>> {
    return this.requests.listMatched(user, query);
  }

  @Get('mine/offers')
  @RequirePermissions(Permission.REQUEST_READ_OWN)
  @ApiOperation({ summary: 'Alıcının tüm taleplerine gelen teklifleri listeler' })
  listMyOffers(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRequestsQueryDto,
  ): Promise<RequestOffer[]> {
    return this.requests.listMyOffers(user, query.limit);
  }

  @Get('nearby')
  @RequirePermissions(Permission.REQUEST_READ_OWN, Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'Kullanıcının şehrindeki açık talepleri listeler' })
  listNearby(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: NearbyRequestsQueryDto,
  ): Promise<CommerceRequest[]> {
    return this.requests.listNearby(user, query.limit);
  }

  @Get(':id')
  @RequirePermissions(
    Permission.REQUEST_READ_OWN,
    Permission.REQUEST_READ_MATCHED,
    Permission.ADMIN_REQUEST_MODERATE,
  )
  @ApiOperation({ summary: 'Talep detayı' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CommerceRequest> {
    return this.requests.getById(user, id);
  }

  @Post(':id/publish')
  @RequirePermissions(Permission.REQUEST_UPDATE_OWN)
  @ApiOperation({ summary: 'Talebi yayınlar, sınıflandırır ve eşleştirir' })
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CommerceRequest> {
    return this.requests.publish(user, id);
  }

  @Post(':id/offers')
  @RequirePermissions(Permission.REQUEST_OFFER_CREATE)
  @ApiOperation({ summary: 'Talebe teklif verir' })
  createOffer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRequestOfferDto,
  ): Promise<RequestOffer> {
    return this.requests.createOffer(user, id, dto);
  }

  @Get(':id/offers')
  @RequirePermissions(Permission.REQUEST_OFFER_ACCEPT, Permission.REQUEST_READ_OWN)
  @ApiOperation({ summary: 'Talebin tekliflerini listeler (alıcı)' })
  listOffers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RequestOffer[]> {
    return this.requests.listOffers(user, id);
  }
}

@ApiTags('Request Offers')
@ApiBearerAuth()
@Controller('request-offers')
export class RequestOffersController {
  constructor(private readonly requests: RequestsService) {}

  @Post(':id/accept')
  @RequirePermissions(Permission.REQUEST_OFFER_ACCEPT)
  @ApiOperation({ summary: 'Tedarik teklifini kabul eder; sohbet ve sipariş köprüsü açar' })
  @ApiOkResponse({ description: 'Kabul edilen teklif, sipariş ve sohbet' })
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ offer: RequestOffer; orderId: string; conversationId: string }> {
    return this.requests.acceptOffer(user, id);
  }
}
