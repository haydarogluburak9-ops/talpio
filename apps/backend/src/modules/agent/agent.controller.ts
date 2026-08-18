import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  MARKETPLACE_ROLES,
  type AgentActionProposal,
  type AgentChatResponse,
  type AgentThread,
} from '@talpio/types';

import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { AgentService } from './agent.service';
import { AiAssistService } from './ai-assist.service';
import {
  AiDraftPromptDto,
  AiOfferDraftDto,
  CreateAgentThreadDto,
  PostAgentMessageDto,
  SalesCoachDto,
} from './dto/agent.dto';

@ApiTags('Agent')
@ApiBearerAuth()
@Roles(...MARKETPLACE_ROLES)
@Controller('agent')
export class AgentController {
  constructor(
    private readonly agent: AgentService,
    private readonly assist: AiAssistService,
  ) {}

  @Post('threads')
  @ApiOperation({ summary: 'Yeni agent sohbeti açar' })
  createThread(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAgentThreadDto,
  ): Promise<AgentThread> {
    return this.agent.createThread(user, dto);
  }

  @Get('threads')
  @ApiOperation({ summary: 'Satıcının agent sohbetlerini listeler' })
  @ApiOkResponse({ description: 'Sohbet listesi' })
  listThreads(@CurrentUser() user: AuthenticatedUser): Promise<AgentThread[]> {
    return this.agent.listThreads(user);
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Sohbet + mesajlar + bekleyen aksiyonlar' })
  getThread(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgentChatResponse> {
    return this.agent.getThread(user, id);
  }

  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Sohbete mesaj gönderir; tool döngüsü senkron çalışır' })
  postMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PostAgentMessageDto,
  ): Promise<AgentChatResponse> {
    return this.agent.postMessage(user, id, dto);
  }

  @Get('actions/pending')
  @ApiOperation({ summary: 'Onay bekleyen yazma aksiyonları' })
  listPending(@CurrentUser() user: AuthenticatedUser): Promise<AgentActionProposal[]> {
    return this.agent.listPendingActions(user);
  }

  @Post('actions/:id/approve')
  @ApiOperation({ summary: 'Yazma aksiyonunu onaylar ve uygular' })
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgentActionProposal> {
    return this.agent.approveAction(user, id);
  }

  @Post('actions/:id/reject')
  @ApiOperation({ summary: 'Yazma aksiyonunu reddeder' })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgentActionProposal> {
    return this.agent.rejectAction(user, id);
  }

  @Post('drafts/request')
  @ApiOperation({ summary: 'AI talep taslağı (yayınlanmaz)' })
  draftRequest(@CurrentUser() user: AuthenticatedUser, @Body() dto: AiDraftPromptDto) {
    return this.assist.draftRequest(user, dto.prompt);
  }

  @Post('drafts/offer')
  @ApiOperation({ summary: 'AI teklif taslağı (fiyat hesaplamaz, yayınlanmaz)' })
  draftOffer(@CurrentUser() user: AuthenticatedUser, @Body() dto: AiOfferDraftDto) {
    return this.assist.draftOffer(user, dto);
  }

  @Post('drafts/social')
  @ApiOperation({ summary: 'AI sosyal gönderi taslağı (yayınlanmaz)' })
  draftSocial(@CurrentUser() user: AuthenticatedUser, @Body() dto: AiDraftPromptDto) {
    return this.assist.draftSocial(user, dto.prompt);
  }

  @Post('sales-coach')
  @ApiOperation({ summary: 'Satış koçu — sayılar backend, metin LLM' })
  salesCoach(@CurrentUser() user: AuthenticatedUser, @Body() dto: SalesCoachDto) {
    return this.assist.salesCoach(user, dto.businessId);
  }
}
