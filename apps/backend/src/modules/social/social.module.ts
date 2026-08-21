import { Module } from '@nestjs/common';

import { AdminModule } from '@modules/admin/admin.module';
import { FilesModule } from '@modules/files/files.module';
import { MessagesModule } from '@modules/messages/messages.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { RequestsModule } from '@modules/requests/requests.module';

import { SocialAnalyticsService } from './analytics.service';
import { CategoryFollowsService } from './category-follows.service';
import { FeedService } from './feed.service';
import { FollowsService } from './follows.service';
import { SocialGraphService } from './graph.service';
import { InteractionsService } from './interactions.service';
import { ModerationService } from './moderation.service';
import { PostsService } from './posts.service';
import { ProfilesService } from './profiles.service';
import { SocialBridgeService } from './social-bridge.service';
import { SocialController } from './social.controller';
import { SocialMaintenanceService } from './social-maintenance.service';
import { SocialRealtimeService } from './social-realtime.service';
import { StoryHighlightsService } from './story-highlights.service';
import { TrendingService } from './trending.service';

@Module({
  imports: [FilesModule, NotificationsModule, AdminModule, RequestsModule, MessagesModule],
  controllers: [SocialController],
  providers: [
    ProfilesService,
    FollowsService,
    CategoryFollowsService,
    SocialGraphService,
    TrendingService,
    PostsService,
    InteractionsService,
    FeedService,
    SocialAnalyticsService,
    ModerationService,
    SocialBridgeService,
    SocialRealtimeService,
    SocialMaintenanceService,
    StoryHighlightsService,
  ],
  exports: [ProfilesService, PostsService, FeedService, SocialBridgeService, CategoryFollowsService, SocialRealtimeService, StoryHighlightsService],
})
export class SocialModule {}
