import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole, type JobRequest } from '@ustapilot/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { CancelJobDto, CreateJobDto } from './dto/create-job.dto';
import { AvailableJobsQueryDto, ListJobsQueryDto } from './dto/list-jobs-query.dto';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Yeni iş talebi oluşturur' })
  @ApiCreatedResponse({ description: 'Oluşturulan talep' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateJobDto): Promise<JobRequest> {
    return this.jobs.create(user, dto);
  }

  @Get()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Oturum sahibinin iş taleplerini listeler' })
  @ApiOkResponse({ description: 'Sayfalı talep listesi' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListJobsQueryDto,
  ): Promise<PaginatedResult<JobRequest>> {
    return this.jobs.listMine(user, query);
  }

  /**
   * Sabit yol, `:id` parametresinden önce tanımlanmalıdır; aksi halde
   * "available" bir kimlik sanılır.
   */
  @Get('available')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Ustaya açık iş havuzunu listeler' })
  listAvailable(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AvailableJobsQueryDto,
  ): Promise<PaginatedResult<JobRequest>> {
    return this.jobs.listAvailable(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tek bir iş talebini getirir' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<JobRequest> {
    return this.jobs.getById(user, id);
  }

  @Post(':id/publish')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Taslak talebi yayına alır' })
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<JobRequest> {
    return this.jobs.publish(user, id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Talebi iptal eder' })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelJobDto,
  ): Promise<JobRequest> {
    return this.jobs.cancel(user, id, dto.reason);
  }
}
