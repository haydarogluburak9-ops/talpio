import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Complaint, SupportMessage, SupportTicket, SupportTicketDetail } from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import {
  CreateComplaintDto,
  CreateSupportTicketDto,
  ListComplaintsQueryDto,
  ListSupportTicketsQueryDto,
  SupportTicketReplyDto,
} from './dto/support.dto';
import { SupportService } from './support.service';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Destek bileti açar' })
  @ApiCreatedResponse({ description: 'Oluşturulan bilet ve ilk mesaj' })
  createTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSupportTicketDto,
  ): Promise<SupportTicketDetail> {
    return this.support.createTicket(user, dto);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Kullanıcının destek biletlerini listeler' })
  @ApiOkResponse({ description: 'Sayfalı bilet listesi' })
  listTickets(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListSupportTicketsQueryDto,
  ): Promise<PaginatedResult<SupportTicket>> {
    return this.support.listMine(user, query);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Destek bileti detayı ve mesajlar' })
  getTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SupportTicketDetail> {
    return this.support.getById(user, id);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Bilete mesaj ekler; personel yanıtında bildirim gider' })
  addMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SupportTicketReplyDto,
  ): Promise<SupportMessage> {
    return this.support.addMessage(user, id, dto);
  }

  @Post('tickets/:id/close')
  @ApiOperation({ summary: 'Destek biletini kapatır' })
  closeTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SupportTicket> {
    return this.support.closeTicket(user, id);
  }

  @Post('complaints')
  @ApiOperation({ summary: 'Şikâyet oluşturur' })
  @ApiCreatedResponse({ description: 'Oluşturulan şikâyet' })
  createComplaint(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateComplaintDto,
  ): Promise<Complaint> {
    return this.support.createComplaint(user, dto);
  }

  @Get('complaints')
  @ApiOperation({ summary: 'Kullanıcının şikâyetlerini listeler' })
  @ApiOkResponse({ description: 'Sayfalı şikâyet listesi' })
  listComplaints(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListComplaintsQueryDto,
  ): Promise<PaginatedResult<Complaint>> {
    return this.support.listMyComplaints(user, query);
  }
}
