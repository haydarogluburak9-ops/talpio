import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AiCreditTransaction,
  AiCreditWalletSummary,
  AiUsageRecordView,
  SubscriptionPlan,
} from '@talpio/types';

import { Public } from '@modules/auth/decorators/public.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { AiCreditService } from './ai-credit.service';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly credits: AiCreditService) {}

  @Get('credits')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AI kredi cüzdan özeti' })
  @ApiOkResponse({ description: 'Bakiye ve dönem bilgisi' })
  getCredits(@CurrentUser() user: AuthenticatedUser): Promise<AiCreditWalletSummary> {
    return this.credits.getWalletSummary(user.id);
  }

  @Get('credits/transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AI kredi hareketleri' })
  listTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ): Promise<AiCreditTransaction[]> {
    const parsed = limit ? Number.parseInt(limit, 10) : 50;
    return this.credits.listTransactions(user.id, Number.isFinite(parsed) ? parsed : 50);
  }

  @Get('usage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AI kullanım kayıtları' })
  listUsage(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ): Promise<AiUsageRecordView[]> {
    const parsed = limit ? Number.parseInt(limit, 10) : 50;
    return this.credits.listUsage(user.id, Number.isFinite(parsed) ? parsed : 50);
  }

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'Abonelik planlarını listeler' })
  @ApiOkResponse({ description: 'Aktif planlar' })
  listPlans(): Promise<SubscriptionPlan[]> {
    return this.credits.listPlans();
  }
}
