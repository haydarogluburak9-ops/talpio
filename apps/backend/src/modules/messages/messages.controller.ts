import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Conversation, Message } from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import {
  ListConversationsQueryDto,
  ListMessagesQueryDto,
  OpenConversationDto,
  SendMessageDto,
} from './dto/message.dto';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages/conversations')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Siparişin sohbetini açar; yoksa oluşturur' })
  @ApiCreatedResponse({ description: 'Sohbet' })
  open(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OpenConversationDto,
  ): Promise<Conversation> {
    return this.messages.openForOrder(user, dto.orderId);
  }

  @Get()
  @ApiOperation({ summary: 'Kullanıcının sohbetlerini listeler' })
  @ApiOkResponse({ description: 'Sayfalı sohbet listesi' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListConversationsQueryDto,
  ): Promise<PaginatedResult<Conversation>> {
    return this.messages.listConversations(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tek bir sohbeti getirir' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Conversation> {
    return this.messages.getConversation(user, id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Sohbetin mesajlarını en yeniden eskiye listeler' })
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<PaginatedResult<Message>> {
    return this.messages.listMessages(user, id, query);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Sohbete mesaj gönderir' })
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ): Promise<Message> {
    return this.messages.send(user, id, dto);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Sohbeti okundu işaretler' })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Conversation> {
    return this.messages.markRead(user, id);
  }
}
