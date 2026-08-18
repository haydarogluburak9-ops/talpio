import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  MARKETPLACE_ROLES,
  UserRole,
  type Payment,
  type ProviderWalletSummary,
  type Transaction,
} from '@talpio/types';
import type { Request } from 'express';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Public } from '@modules/auth/decorators/public.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { ListPaymentsQueryDto, ListTransactionsQueryDto } from './dto/list-payments-query.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentsService } from './payments.service';

/** Para hareketi yazma yetkisi destek temsilcisine açılmaz. */
const REFUND_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Oturumdaki tarafın ödemelerini listeler' })
  @ApiOkResponse({ description: 'Sayfalı ödeme listesi' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListPaymentsQueryDto,
  ): Promise<PaginatedResult<Payment>> {
    return this.payments.listMine(user, query);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Muhasebe hareketlerini listeler' })
  @ApiOkResponse({ description: 'Sayfalı hareket listesi' })
  listTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTransactionsQueryDto,
  ): Promise<PaginatedResult<Transaction>> {
    return this.payments.listTransactions(user, query);
  }

  @Get('wallet')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Satıcının cüzdan özeti' })
  @ApiOkResponse({ description: 'Kullanılabilir bakiye ve bloke hakediş' })
  wallet(@CurrentUser() user: AuthenticatedUser): Promise<ProviderWalletSummary> {
    return this.payments.walletSummary(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tek bir ödemeyi getirir' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Payment> {
    return this.payments.getById(user, id);
  }

  /**
   * Sağlayıcı geri bildirimi.
   *
   * Herkese açıktır çünkü çağıran bir kullanıcı değil sağlayıcıdır; kimlik
   * doğrulaması jeton yerine gövdenin imzasıyla yapılır.
   */
  @Post('webhook')
  @Public()
  @ApiExcludeEndpoint()
  webhook(@Req() request: RawBodyRequest<Request>): Promise<{ applied: boolean }> {
    return this.payments.handleWebhook({
      headers: request.headers as Record<string, string | undefined>,
      rawBody: request.rawBody ?? Buffer.alloc(0),
    });
  }

  @Post(':id/refund')
  @Roles(...REFUND_ROLES)
  @ApiOperation({ summary: 'Tahsil edilmiş ödemeyi iade eder' })
  @ApiOkResponse({ description: 'İade edilmiş ödeme' })
  refund(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundPaymentDto,
  ): Promise<Payment> {
    return this.payments.refund(actor, id, dto);
  }
}
