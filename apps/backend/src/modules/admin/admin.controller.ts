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
  type AdminDashboard,
  type AdminJobSummary,
  type AdminOfferSummary,
  type AdminOrderSummary,
  type AdminProviderSummary,
  type AdminUserSummary,
  type AuditLogEntry,
} from '@ustapilot/types';
import type { Request } from 'express';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { AdminService, type RequestContext } from './admin.service';
import { AuditLogService } from './audit-log.service';
import {
  ListAdminJobsQueryDto,
  ListAdminOffersQueryDto,
  ListAdminOrdersQueryDto,
  ListAdminProvidersQueryDto,
  ListAdminUsersQueryDto,
  ListAuditLogsQueryDto,
  UpdateUserStatusDto,
  UpdateVerificationDto,
} from './dto/admin-query.dto';

/**
 * Panelin okuma uçları destek ekibine de açıktır; yazma uçları yalnızca
 * yönetim rollerine. Destek temsilcisinin bir kaydı görmesi gerekir ama
 * bir hesabı engelleyebilmesi gerekmez.
 */
const READ_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT] as const;
const WRITE_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AuditLogService,
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
