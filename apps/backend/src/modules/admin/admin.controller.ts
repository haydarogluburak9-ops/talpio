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
  Permission,
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
  type AdminReviewSummary,
  type AdminRoleMatrix,
  type AdminSupportTicketDetail,
  type AdminSupportTicketSummary,
  type AdminSystemSetting,
  type AdminTransactionSummary,
  type AdminUserSummary,
  type AuditLogEntry,
  type ServiceCategory,
  type SupportMessage,
} from '@talpio/types';
import type { Request } from 'express';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
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
  ListAdminReviewsQueryDto,
  ListAdminTransactionsQueryDto,
  ListAdminUsersQueryDto,
  CreateAdminCategoryDto,
  ListAuditLogsQueryDto,
  UpdateAdminCategoryDto,
  UpdateReviewModerationDto,
  UpdateSystemSettingDto,
  UpdateUserStatusDto,
  UpdateVerificationDto,
  UpdateContentReportDto,
  ListContentReportsQueryDto,
  BulkContentReportDto,
  UpdateFraudFlagDto,
  VerifyBackupDto,
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
  @ApiOperation({ summary: 'Satıcı listesi' })
  @ApiOkResponse({ description: 'Sayfalanmış satıcı listesi' })
  listProviders(
    @Query() query: ListAdminProvidersQueryDto,
  ): Promise<PaginatedResult<AdminProviderSummary>> {
    return this.admin.listProviders(query);
  }

  @Get('providers/:id/documents')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Satıcının kuruluş belgelerini imzalı adresle listeler' })
  listProviderDocuments(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.listProviderDocuments(id);
  }

  @Patch('providers/:id/verification')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Satıcı doğrulama kararını uygular' })
  @ApiOkResponse({ description: 'Güncellenmiş satıcı' })
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

  @Get('reviews')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Değerlendirme listesi' })
  @ApiOkResponse({ description: 'Sayfalanmış değerlendirme listesi' })
  listReviews(
    @Query() query: ListAdminReviewsQueryDto,
  ): Promise<PaginatedResult<AdminReviewSummary>> {
    return this.admin.listReviews(query);
  }

  @Patch('reviews/:id')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'Değerlendirmeyi yayınlar veya gizler' })
  @ApiOkResponse({ description: 'Güncellenmiş değerlendirme' })
  updateReviewModeration(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewModerationDto,
    @Req() request: Request,
  ): Promise<AdminReviewSummary> {
    return this.admin.updateReviewModeration(actor, id, dto, contextFrom(request));
  }

  @Get('settings/roles')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Rol ve izin matrisi' })
  @ApiOkResponse({ description: 'Salt okunur izin matrisi' })
  listRoleMatrix(): AdminRoleMatrix {
    return this.admin.listRoleMatrix();
  }

  @Get('settings')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Sistem ayarları' })
  @ApiOkResponse({ description: 'Anahtar-değer ayar listesi' })
  listSettings(): Promise<AdminSystemSetting[]> {
    return this.admin.listSettings();
  }

  @Patch('settings')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Sistem ayarını günceller' })
  @ApiOkResponse({ description: 'Güncellenmiş ayar' })
  updateSetting(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: UpdateSystemSettingDto,
    @Req() request: Request,
  ): Promise<AdminSystemSetting> {
    return this.admin.updateSetting(actor, dto, contextFrom(request));
  }

  @Get('audit-logs')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Denetim kayıtları' })
  @ApiOkResponse({ description: 'Sayfalanmış denetim kaydı listesi' })
  listAuditLogs(@Query() query: ListAuditLogsQueryDto): Promise<PaginatedResult<AuditLogEntry>> {
    return this.audit.list(query);
  }

  @Get('categories')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Katalog kategorileri (pasifler dahil)' })
  @ApiOkResponse({ description: 'Kategori listesi' })
  listCategories(): Promise<ServiceCategory[]> {
    return this.admin.listCategories();
  }

  @Post('categories')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Yeni kategori oluşturur' })
  @ApiOkResponse({ description: 'Oluşturulan kategori' })
  createCategory(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateAdminCategoryDto,
    @Req() request: Request,
  ): Promise<ServiceCategory> {
    return this.admin.createCategory(actor, dto, contextFrom(request));
  }

  @Patch('categories/:id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Kategori günceller / etkinleştirir' })
  @ApiOkResponse({ description: 'Güncellenmiş kategori' })
  updateCategory(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminCategoryDto,
    @Req() request: Request,
  ): Promise<ServiceCategory> {
    return this.admin.updateCategory(actor, id, dto, contextFrom(request));
  }

  @Get('subscriptions')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Abonelikler' })
  listSubscriptions() {
    return this.admin.listSubscriptions();
  }

  @Get('ai-usage')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'AI kullanım kayıtları' })
  listAiUsage() {
    return this.admin.listAiUsage();
  }

  @Get('campaigns')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'İşletme kampanyaları' })
  listCampaigns() {
    return this.admin.listCampaigns();
  }

  @Get('moderation/reports')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'İçerik bildirim kuyruğu' })
  listContentReports(@Query() query: ListContentReportsQueryDto) {
    return this.admin.listContentReports(query);
  }

  @Post('moderation/reports/bulk')
  @Roles(...WRITE_ROLES)
  @RequirePermissions(Permission.ADMIN_SOCIAL_MODERATE)
  @ApiOperation({ summary: 'İçerik bildirimlerinde toplu işlem' })
  bulkUpdateContentReports(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: BulkContentReportDto,
    @Req() request: Request,
  ) {
    return this.admin.bulkUpdateContentReports(actor, dto, contextFrom(request));
  }

  @Patch('moderation/reports/:id')
  @Roles(...WRITE_ROLES)
  @RequirePermissions(Permission.ADMIN_SOCIAL_MODERATE)
  @ApiOperation({
    summary: 'İçerik bildirimini inceler; gerekirse içeriği kaldırır veya hesabı durdurur',
  })
  updateContentReport(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentReportDto,
    @Req() request: Request,
  ) {
    return this.admin.updateContentReport(actor, id, dto, contextFrom(request));
  }

  @Get('commerce-requests')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Ticaret talepleri (CommerceRequest)' })
  listCommerceRequests() {
    return this.admin.listCommerceRequests();
  }

  @Get('fraud-flags')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'Dolandırıcılık bayrakları (otomatik ban yok)' })
  listFraudFlags(@Query('status') status?: string) {
    return this.admin.listFraudFlags(status);
  }

  @Patch('fraud-flags/:id')
  @Roles(...WRITE_ROLES)
  @RequirePermissions(Permission.ADMIN_REQUEST_MODERATE)
  @ApiOperation({ summary: 'Bayrak durumunu günceller; otomatik ban yok' })
  updateFraudFlag(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFraudFlagDto,
    @Req() request: Request,
  ) {
    return this.admin.updateFraudFlag(actor, id, dto, contextFrom(request));
  }

  @Get('backup-status')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Son doğrulanmış yedek ve recovery checklist' })
  getBackupStatus() {
    return this.admin.getBackupStatus();
  }

  @Post('backup-status/verify')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Runbook doğrulamasını kaydeder; otomatik yedek iddiası üretmez' })
  verifyBackup(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: VerifyBackupDto,
    @Req() request: Request,
  ) {
    return this.admin.verifyBackup(actor, dto, contextFrom(request));
  }

  @Get('queues/dead-letters')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Dead-letter kuyruğu' })
  listDeadLetters() {
    return this.admin.listDeadLetters();
  }
}

function contextFrom(request: Request): RequestContext {
  return {
    ipAddress: request.ip,
    userAgent: request.header('user-agent')?.slice(0, 500),
  };
}
