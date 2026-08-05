import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  UserRole,
  type AdminCommissionRuleSummary,
  type AdminComplaintSummary,
  type AdminDashboard,
  type AdminJobSummary,
  type AdminNotificationSummary,
  type AdminOfferSummary,
  type AdminOrderSummary,
  type AdminPaymentSummary,
  type AdminProviderSummary,
  type AdminSupportTicketDetail,
  type AdminSupportTicketSummary,
  type AdminTransactionSummary,
  type AdminUserSummary,
  type AuditLogEntry,
  type SupportMessage,
} from '@ustapilot/types';
import type { Request } from 'express';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import {
  ListComplaintsQueryDto,
  ListSupportTicketsQueryDto,
  SupportTicketReplyDto,
  UpdateComplaintDto,
  UpdateSupportTicketDto,
} from '@modules/support/dto/support.dto';
import { SupportService } from '@modules/support/support.service';

import { AdminService, type RequestContext } from './admin.service';
import { AuditLogService } from './audit-log.service';
import {
  ListAdminCommissionsQueryDto,
  ListAdminJobsQueryDto,
  ListAdminNotificationsQueryDto,
  ListAdminOffersQueryDto,
  ListAdminOrdersQueryDto,
  ListAdminPaymentsQueryDto,
  ListAdminProvidersQueryDto,
  ListAdminTransactionsQueryDto,
  ListAdminUsersQueryDto,
  ListAuditLogsQueryDto,
  UpdateUserStatusDto,
  UpdateVerificationDto,
} from './dto/admin-query.dto';

/**
 * Panelin okuma uçları destek ekibine de açıktır; yazma uçları yalnızca
 * yönetim rollerine. Destek temsilcisinin bir kaydı görmesi gerekir ama
 * bir hesabı engelleyebilmesi gerekmez. Destek biletleri ve şikâyetler bu
 * ayrımdan muaftır: yanıtlamak SUPPORT rolünün işinin parçasıdır.
 */
const READ_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT] as const;
const WRITE_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;
const SUPPORT_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT] as const;

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AuditLogService,
    private readonly support: SupportService,
  ) {}

  @Get('dashboard')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Panel özet sayımları' })
  @ApiOkResponse({ description: 'Özet kartlar' })
  dashboard(): Promise<AdminDashboard> {
    return this.admin.dashboard();
  }

  @Get('users')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Kullanıcı listesi' })
  @ApiOkResponse({ description: 'Sayfalanmış kullanıcı listesi' })
  listUsers(@Query() query: ListAdminUsersQueryDto): Promise<PaginatedResult<AdminUserSummary>> {
    return this.admin.listUsers(query);
  }

  @Get('users/:id')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Kullanıcı ayrıntısı' })
  @ApiOkResponse({ description: 'Kullanıcı' })
  getUser(@Param('id', ParseUUIDPipe) id: string): Promise<AdminUserSummary> {
    return this.admin.getUser(id);
  }

  @Patch('users/:id/status')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Hesap durumunu değiştirir' })
  @ApiOkResponse({ description: 'Güncellenmiş kullanıcı' })
  updateUserStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() request: Request,
  ): Promise<AdminUserSummary> {
    return this.admin.updateUserStatus(actor, id, dto, contextFrom(request));
  }

  @Post('users/:id/revoke-sessions')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Kullanıcının tüm oturumlarını kapatır' })
  @ApiOkResponse({ description: 'Kapatılan oturum sayısı' })
  revokeSessions(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<{ revokedCount: number }> {
    return this.admin.revokeUserSessions(actor, id, contextFrom(request));
  }

  @Get('providers')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Usta listesi' })
  @ApiOkResponse({ description: 'Sayfalanmış usta listesi' })
  listProviders(
    @Query() query: ListAdminProvidersQueryDto,
  ): Promise<PaginatedResult<AdminProviderSummary>> {
    return this.admin.listProviders(query);
  }

  @Patch('providers/:id/verification')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Usta doğrulama kararını uygular' })
  @ApiOkResponse({ description: 'Güncellenmiş usta' })
  updateVerification(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVerificationDto,
    @Req() request: Request,
  ): Promise<AdminProviderSummary> {
    return this.admin.updateProviderVerification(actor, id, dto, contextFrom(request));
  }

  @Get('jobs')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Talep listesi' })
  @ApiOkResponse({ description: 'Sayfalanmış talep listesi' })
  listJobs(@Query() query: ListAdminJobsQueryDto): Promise<PaginatedResult<AdminJobSummary>> {
    return this.admin.listJobs(query);
  }

  @Get('offers')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Teklif listesi' })
  @ApiOkResponse({ description: 'Sayfalanmış teklif listesi' })
  listOffers(@Query() query: ListAdminOffersQueryDto): Promise<PaginatedResult<AdminOfferSummary>> {
    return this.admin.listOffers(query);
  }

  @Get('orders')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Sipariş listesi' })
  @ApiOkResponse({ description: 'Sayfalanmış sipariş listesi' })
  listOrders(@Query() query: ListAdminOrdersQueryDto): Promise<PaginatedResult<AdminOrderSummary>> {
    return this.admin.listOrders(query);
  }

  @Get('payments')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Ödeme listesi' })
  @ApiOkResponse({ description: 'Sayfalanmış ödeme listesi' })
  listPayments(
    @Query() query: ListAdminPaymentsQueryDto,
  ): Promise<PaginatedResult<AdminPaymentSummary>> {
    return this.admin.listPayments(query);
  }

  @Get('transactions')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Muhasebe hareketleri' })
  @ApiOkResponse({ description: 'Sayfalanmış hareket listesi' })
  listTransactions(
    @Query() query: ListAdminTransactionsQueryDto,
  ): Promise<PaginatedResult<AdminTransactionSummary>> {
    return this.admin.listTransactions(query);
  }

  @Get('commissions')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Komisyon kuralları' })
  @ApiOkResponse({ description: 'Sayfalanmış komisyon kuralı listesi' })
  listCommissions(
    @Query() query: ListAdminCommissionsQueryDto,
  ): Promise<PaginatedResult<AdminCommissionRuleSummary>> {
    return this.admin.listCommissionRules(query);
  }

  @Get('notifications')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Bildirim listesi' })
  @ApiOkResponse({ description: 'Sayfalanmış bildirim listesi' })
  listNotifications(
    @Query() query: ListAdminNotificationsQueryDto,
  ): Promise<PaginatedResult<AdminNotificationSummary>> {
    return this.admin.listNotifications(query);
  }

  @Get('support-tickets')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'Destek talepleri listesi' })
  @ApiOkResponse({ description: 'Sayfalanmış destek talebi listesi' })
  listSupportTickets(
    @Query() query: ListSupportTicketsQueryDto,
  ): Promise<PaginatedResult<AdminSupportTicketSummary>> {
    return this.support.listAllTickets(query);
  }

  @Get('support-tickets/:id')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'Destek talebi detayı' })
  @ApiOkResponse({ description: 'Destek talebi ve mesajlar' })
  getSupportTicket(@Param('id', ParseUUIDPipe) id: string): Promise<AdminSupportTicketDetail> {
    return this.support.getTicketForStaff(id);
  }

  @Patch('support-tickets/:id')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'Destek talebini atar veya durumunu değiştirir' })
  @ApiOkResponse({ description: 'Güncellenmiş destek talebi' })
  updateSupportTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupportTicketDto,
  ): Promise<AdminSupportTicketDetail> {
    return this.support.updateTicket(id, dto);
  }

  @Post('support-tickets/:id/messages')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'Destek talebine personel yanıtı yazar' })
  @ApiOkResponse({ description: 'Yazılan mesaj' })
  replySupportTicket(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SupportTicketReplyDto,
  ): Promise<SupportMessage> {
    return this.support.addMessage(actor, id, dto);
  }

  @Get('complaints')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'Şikâyet listesi' })
  @ApiOkResponse({ description: 'Sayfalanmış şikâyet listesi' })
  listComplaints(
    @Query() query: ListComplaintsQueryDto,
  ): Promise<PaginatedResult<AdminComplaintSummary>> {
    return this.support.listAllComplaints(query);
  }

  @Patch('complaints/:id')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'Şikâyeti inceler veya karara bağlar' })
  @ApiOkResponse({ description: 'Güncellenmiş şikâyet' })
  updateComplaint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateComplaintDto,
  ): Promise<AdminComplaintSummary> {
    return this.support.updateComplaint(id, dto);
  }

  @Get('audit-logs')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Denetim kayıtları' })
  @ApiOkResponse({ description: 'Sayfalanmış denetim kaydı listesi' })
  listAuditLogs(@Query() query: ListAuditLogsQueryDto): Promise<PaginatedResult<AuditLogEntry>> {
    return this.audit.list(query);
  }
}

function contextFrom(request: Request): RequestContext {
  return {
    ipAddress: request.ip,
    userAgent: request.header('user-agent')?.slice(0, 500),
  };
}
