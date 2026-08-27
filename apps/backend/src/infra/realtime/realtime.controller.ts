import { Controller, MessageEvent, Query, Req, Sse } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RealtimeEvent } from '@talpio/types';
import type { Request } from 'express';
import { Observable } from 'rxjs';

import { AppConfigService } from '@config/app-config.service';
import { RealtimeBusService } from '@infra/realtime/realtime-bus.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

@ApiTags('realtime')
@ApiBearerAuth()
@Controller('realtime')
export class RealtimeController {
  constructor(
    private readonly bus: RealtimeBusService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * SSE canlı olay akışı.
   * `watchPosts`: virgülle ayrılmış gönderi kimlikleri — açık feed'de canlı sayaç güncellemesi.
   */
  @Sse('stream')
  @ApiOperation({ summary: 'Canlı olay akışı (SSE)' })
  stream(
    @Req() req: Request & { user: AuthenticatedUser },
    @Query('watchPosts') watchPosts?: string,
  ): Observable<MessageEvent> {
    if (!this.config.realtimeEnabled) {
      return new Observable((subscriber) => {
        subscriber.next({ type: 'error', data: { message: 'Realtime kapalı' } });
        subscriber.complete();
      });
    }

    const userId = req.user.id;
    const postIds = (watchPosts ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 40);

    return new Observable<MessageEvent>((subscriber) => {
      let closed = false;
      const push = (event: RealtimeEvent) => {
        if (closed) return;
        subscriber.next({ type: event.type, data: JSON.stringify(event) });
      };

      void (async () => {
        const detachUser = await this.bus.subscribeUser(userId, push);
        const detachPosts =
          postIds.length > 0 ? await this.bus.subscribePosts(postIds, push) : () => undefined;

        push({
          type: 'social.feed.invalidate',
          payload: { ready: true },
          at: new Date().toISOString(),
        });

        req.on('close', () => {
          closed = true;
          detachUser();
          detachPosts();
          subscriber.complete();
        });
      })();
    });
  }
}
