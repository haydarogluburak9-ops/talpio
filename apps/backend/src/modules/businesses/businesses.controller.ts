import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Permission } from '@talpio/types';

import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { BusinessesService } from './businesses.service';
import { CampaignsService } from './campaigns.service';
import { CreateSupplierBusinessDto } from './dto/create-supplier.dto';
import { UpdateBusinessLocaleSettingsDto } from './dto/locale-settings.dto';
import {
  CreateBusinessTaskDto,
  CreateCampaignDto,
  CreateCrmCustomerDto,
  CreateCrmFollowUpDto,
  CreateCrmNoteDto,
  CreateWorkOrderDto,
  AssignWorkOrderDto,
  UpdateBusinessTaskStatusDto,
  UpdateWorkOrderStageDto,
} from './dto/ops.dto';
import { BusinessOpsService } from './ops.service';
import { TrustScoreService } from './trust-score.service';

@ApiTags('Businesses')
@ApiBearerAuth()
@Controller('businesses')
export class BusinessesController {
  constructor(
    private readonly businesses: BusinessesService,
    private readonly ops: BusinessOpsService,
    private readonly campaigns: CampaignsService,
    private readonly trust: TrustScoreService,
  ) {}

  @Post('supplier')
  @RequirePermissions(
    Permission.SUPPLIER_PROFILE_MANAGE,
    Permission.REQUEST_CREATE,
    Permission.PROVIDER_PROFILE_MANAGE_OWN,
  )
  @ApiOperation({ summary: 'Tedarikçi işletmesi oluşturur' })
  @ApiCreatedResponse({ description: 'Oluşturulan işletme listesi' })
  createSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSupplierBusinessDto,
  ) {
    return this.businesses.createSupplier(user, dto);
  }

  @Get('mine')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE, Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'Üye olunan işletmeleri listeler' })
  @ApiOkResponse({ description: 'İşletme listesi' })
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.businesses.getMine(user);
  }

  @Get(':id/locale-settings')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE)
  @ApiOperation({ summary: 'İşletme locale / currency ayarları' })
  getLocale(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.businesses.getLocaleSettings(user, id);
  }

  @Patch(':id/locale-settings')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE)
  @ApiOperation({ summary: 'İşletme locale / currency ayarlarını günceller' })
  updateLocale(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessLocaleSettingsDto,
  ) {
    return this.businesses.updateLocaleSettings(user, id, dto);
  }

  @Get(':id/trust-score')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE, Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'İşletme güven skoru (premium bağımsız)' })
  trustScore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.trust.recomputeForUser(user, id);
  }

  @Get(':id/dashboard')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE, Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'Satıcı paneli v2 özeti' })
  dashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ops.dashboard(user, id);
  }

  @Get(':id/crm/customers')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE, Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'İşletme CRM müşteri listesi' })
  crmCustomers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ops.listCrmCustomers(user, id);
  }

  @Post(':id/crm/customers')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE)
  @ApiOperation({ summary: 'CRM müşteri oluşturur' })
  createCrmCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCrmCustomerDto,
  ) {
    return this.ops.createCrmCustomer(user, id, dto);
  }

  @Get(':id/crm/customers/:customerId')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE, Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'CRM müşteri ayrıntısı' })
  crmCustomerDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.ops.getCrmCustomer(user, id, customerId);
  }

  @Post(':id/crm/customers/:customerId/notes')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE)
  @ApiOperation({ summary: 'CRM not ekler' })
  addCrmNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: CreateCrmNoteDto,
  ) {
    return this.ops.addCrmNote(user, id, customerId, dto.body, dto.fileAssetId);
  }

  @Post(':id/crm/customers/:customerId/follow-ups')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE)
  @ApiOperation({ summary: 'CRM takip oluşturur' })
  addCrmFollowUp(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: CreateCrmFollowUpDto,
  ) {
    return this.ops.addCrmFollowUp(user, id, customerId, dto);
  }

  @Patch(':id/crm/customers/:customerId/follow-ups/:followUpId/complete')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE)
  @ApiOperation({ summary: 'CRM takibini tamamlar' })
  completeCrmFollowUp(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('followUpId', ParseUUIDPipe) followUpId: string,
  ) {
    return this.ops.completeCrmFollowUp(user, id, customerId, followUpId);
  }

  @Get(':id/crm/analytics')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE, Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'CRM özet sayıları (LLM hesaplamaz)' })
  crmAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ops.crmAnalytics(user, id);
  }

  @Get(':id/work-orders')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE, Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'İş emirleri' })
  workOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ops.listWorkOrders(user, id);
  }

  @Get(':id/work-orders/board')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE, Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'İş emri kanban kolonları' })
  workOrderBoard(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ops.listWorkOrderBoard(user, id);
  }

  @Post(':id/work-orders')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE)
  @ApiOperation({ summary: 'İş emri oluşturur' })
  createWorkOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWorkOrderDto,
  ) {
    return this.ops.createWorkOrder(user, id, dto);
  }

  @Patch(':id/work-orders/:workOrderId/stage')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE)
  @ApiOperation({ summary: 'İş emri aşamasını günceller' })
  updateWorkOrderStage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Body() dto: UpdateWorkOrderStageDto,
  ) {
    return this.ops.updateWorkOrderStage(user, id, workOrderId, dto.stage);
  }

  @Patch(':id/work-orders/:workOrderId/assign')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE)
  @ApiOperation({ summary: 'İş emrine ekip üyesi atar' })
  assignWorkOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Body() dto: AssignWorkOrderDto,
  ) {
    return this.ops.assignWorkOrder(user, id, workOrderId, dto.assigneeUserId);
  }

  @Get(':id/tasks')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE, Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'Görevler' })
  tasks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ops.listTasks(user, id);
  }

  @Post(':id/tasks')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Görev oluşturur' })
  createTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBusinessTaskDto,
  ) {
    return this.ops.createTask(user, id, dto);
  }

  @Patch(':id/tasks/:taskId/status')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Görev durumunu günceller' })
  updateTaskStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateBusinessTaskStatusDto,
  ) {
    return this.ops.updateTaskStatus(user, id, taskId, dto.status);
  }

  @Get(':id/campaigns')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE, Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'Kampanyalar' })
  listCampaigns(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaigns.list(user, id);
  }

  @Post(':id/campaigns')
  @RequirePermissions(Permission.SUPPLIER_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Kampanya oluşturur' })
  createCampaign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaigns.create(user, id, dto);
  }
}
