import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  UserRole,
  type DeviceToken,
  type Notification,
  type NotificationFeedMeta,
} from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import type { OutboxEntry } from '@infra/notifications/notification-outbox';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { RegisterDeviceTokenDto, RemoveDeviceTokenDto } from './dto/device-token.dto';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Oturumdaki kullanıcının bildirimlerini listeler' })
  @ApiOkResponse({ description: 'Sayfalı bildirim listesi; üst veri okunmamış sayacını taşır' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<PaginatedResult<Notification, NotificationFeedMeta>> {
    return this.notifications.listMine(user, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Okunmamış bildirim sayısı' })
  async unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<{ unreadCount: number }> {
    return { unreadCount: await this.notifications.unreadCount(user.id) };
  }

  /**
   * Mock sürücülerin tamponu; yalnızca geliştirme ortamında ve yalnızca süper
   * yöneticiye açıktır.
   *
   * Rol kısıtı olmadan bu uç, sıradan bir hesabın başkasının parola sıfırlama
   * bağlantısını okuyup hesabını devralmasına izin veriyordu.
   */
  @Get('mock-outbox')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiExcludeEndpoint()
  listOutbox(): OutboxEntry[] {
    return this.notifications.listOutbox();
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Tüm bildirimleri okundu işaretler' })
  markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<{ updatedCount: number }> {
    return this.notifications.markAllRead(user);
  }

  @Post('device-tokens')
  @ApiOperation({ summary: 'Cihaz jetonu kaydeder' })
  @ApiOkResponse({ description: 'Kaydedilmiş cihaz jetonu' })
  registerDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceTokenDto,
  ): Promise<DeviceToken> {
    return this.notifications.registerDeviceToken(user, dto);
  }

  @Delete('device-tokens')
  @ApiOperation({ summary: 'Cihaz jetonunu siler' })
  removeDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RemoveDeviceTokenDto,
  ): Promise<{ removed: boolean }> {
    return this.notifications.removeDeviceToken(user, dto.token);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Tek bildirimi okundu işaretler' })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Notification> {
    return this.notifications.markRead(user, id);
  }
}
