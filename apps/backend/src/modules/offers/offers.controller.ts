import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MARKETPLACE_ROLES, type Offer } from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { AcceptOfferDto, CreateOfferDto, RejectOfferDto } from './dto/create-offer.dto';
import { ListJobOffersQueryDto, ListMyOffersQueryDto } from './dto/list-offers-query.dto';
import { OffersService } from './offers.service';

@ApiTags('Offers')
@ApiBearerAuth()
@Controller('offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Post()
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Bir iş talebine teklif verir' })
  @ApiCreatedResponse({ description: 'Oluşturulan teklif' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOfferDto): Promise<Offer> {
    return this.offers.create(user, dto);
  }

  /**
   * Sabit yol, `:id` parametresinden önce tanımlanmalıdır; aksi halde
   * "mine" bir kimlik sanılır.
   */
  @Get('mine')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Satıcının verdiği teklifleri listeler' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMyOffersQueryDto,
  ): Promise<PaginatedResult<Offer>> {
    return this.offers.listMine(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tek bir teklifi getirir' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Offer> {
    return this.offers.getById(user, id);
  }

  @Post(':id/accept')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Teklifi kabul eder ve siparişi başlatır' })
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcceptOfferDto,
  ): Promise<Offer> {
    return this.offers.accept(user, id, dto);
  }

  @Post(':id/reject')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Teklifi reddeder' })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectOfferDto,
  ): Promise<Offer> {
    return this.offers.reject(user, id, dto.reason);
  }

  @Post(':id/withdraw')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Satıcının kendi teklifini geri çeker' })
  withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Offer> {
    return this.offers.withdraw(user, id);
  }
}

/**
 * Talebe gelen teklifler kaynak olarak talebin altında yaşar. Ayrı denetleyici
 * kullanılır ki `JobsModule` teklif servisine bağımlı olmasın.
 */
@ApiTags('Offers')
@ApiBearerAuth()
@Controller('jobs')
export class JobOffersController {
  constructor(private readonly offers: OffersService) {}

  @Get(':id/offers')
  @ApiOperation({ summary: 'Bir talebe gelen teklifleri listeler' })
  @ApiOkResponse({ description: 'Sayfalı teklif listesi' })
  listForJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListJobOffersQueryDto,
  ): Promise<PaginatedResult<Offer>> {
    return this.offers.listForJob(user, id, query);
  }
}
