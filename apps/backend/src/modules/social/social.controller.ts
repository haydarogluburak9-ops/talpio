import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Permission,
  type CommerceRequest,
  type ContentReport,
  type Conversation,
  type SocialPost,
  type SocialPostComment,
  type SocialProfile,
  type SocialProfileEducation,
  type SocialProfileExperience,
  type SocialProfileSkill,
  type StoryHighlight,
  type StoryHighlightDetail,
  type TrendingTopic,
} from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Public } from '@modules/auth/decorators/public.decorator';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { MessagesService } from '@modules/messages/messages.service';

import { type CategoryFollowItem, CategoryFollowsService } from './category-follows.service';
import { type SocialAnalyticsSummary, SocialAnalyticsService } from './analytics.service';
import {
  AddGroupMembersDto,
  CreateCommentDto,
  CreateContentReportDto,
  CreateGroupConversationDto,
  CreateProfileEducationDto,
  CreateProfileExperienceDto,
  CreateProfileSkillDto,
  CreatePostDto,
  CreateRequestFromPostDto,
  CreateStoryHighlightDto,
  AddStoryHighlightItemDto,
  DiscoverFeedQueryDto,
  FeedQueryDto,
  ListSocialQueryDto,
  RecordViewsDto,
  ReplaceInterestsDto,
  SearchProfilesQueryDto,
  ShareRequestToFeedDto,
  TrendingQueryDto,
  UpdateProfileEducationDto,
  UpdateProfileExperienceDto,
  UpdateProfileSkillDto,
  UpdateSocialProfileDto,
  UpdateStoryHighlightDto,
} from './dto/social.dto';
import type { FeedPage } from './feed.service';
import { FeedService } from './feed.service';
import { FollowsService } from './follows.service';
import { InteractionsService } from './interactions.service';
import { ModerationService } from './moderation.service';
import { PostsService } from './posts.service';
import { ProfileCareerService } from './profile-career.service';
import { ProfilesService } from './profiles.service';
import { SocialBridgeService } from './social-bridge.service';
import { StoryHighlightsService } from './story-highlights.service';
import { TrendingService } from './trending.service';

@ApiTags('Social')
@ApiBearerAuth()
@Controller('social')
export class SocialController {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly follows: FollowsService,
    private readonly categoryFollows: CategoryFollowsService,
    private readonly posts: PostsService,
    private readonly interactions: InteractionsService,
    private readonly feed: FeedService,
    private readonly analytics: SocialAnalyticsService,
    private readonly moderation: ModerationService,
    private readonly bridge: SocialBridgeService,
    private readonly trending: TrendingService,
    private readonly storyHighlights: StoryHighlightsService,
    private readonly profileCareer: ProfileCareerService,
    private readonly messages: MessagesService,
  ) {}

  @Get('profiles/me')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Kişisel sosyal profili getirir (yoksa oluşturur)' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<SocialProfile> {
    return this.profiles.getMe(user);
  }

  @Patch('profiles/me')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Kişisel sosyal profili günceller' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSocialProfileDto,
  ): Promise<SocialProfile> {
    return this.profiles.updateMe(user, dto);
  }

  @Post('profiles/me/experiences')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'İş deneyimi ekler' })
  createExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProfileExperienceDto,
  ): Promise<SocialProfileExperience> {
    return this.profileCareer.createExperience(user, dto);
  }

  @Patch('profiles/me/experiences/:id')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'İş deneyimini günceller' })
  updateExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileExperienceDto,
  ): Promise<SocialProfileExperience> {
    return this.profileCareer.updateExperience(user, id, dto);
  }

  @Delete('profiles/me/experiences/:id')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'İş deneyimini siler' })
  deleteExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.profileCareer.deleteExperience(user, id);
  }

  @Post('profiles/me/education')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Eğitim kaydı ekler' })
  createEducation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProfileEducationDto,
  ): Promise<SocialProfileEducation> {
    return this.profileCareer.createEducation(user, dto);
  }

  @Patch('profiles/me/education/:id')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Eğitim kaydını günceller' })
  updateEducation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileEducationDto,
  ): Promise<SocialProfileEducation> {
    return this.profileCareer.updateEducation(user, id, dto);
  }

  @Delete('profiles/me/education/:id')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Eğitim kaydını siler' })
  deleteEducation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.profileCareer.deleteEducation(user, id);
  }

  @Get('skills/suggest')
  @ApiOperation({ summary: 'Yetkinlik adı önerir' })
  suggestSkills(@Query('q') query?: string): Promise<string[]> {
    return this.profileCareer.suggestSkills(query ?? '');
  }

  @Get('positions/suggest')
  @ApiOperation({ summary: 'İş deneyimi pozisyon adı önerir' })
  suggestPositions(@Query('q') query?: string): Promise<string[]> {
    return this.profileCareer.suggestPositions(query ?? '');
  }

  @Post('profiles/me/skills')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Yetkinlik ekler' })
  createSkill(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProfileSkillDto,
  ): Promise<SocialProfileSkill> {
    return this.profileCareer.createSkill(user, dto);
  }

  @Patch('profiles/me/skills/:id')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Yetkinliği günceller' })
  updateSkill(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileSkillDto,
  ): Promise<SocialProfileSkill> {
    return this.profileCareer.updateSkill(user, id, dto);
  }

  @Delete('profiles/me/skills/:id')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Yetkinliği siler' })
  deleteSkill(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.profileCareer.deleteSkill(user, id);
  }

  @Public()
  @Get('profiles/search')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Kullanıcı adı veya isme göre kişi arar' })
  searchProfiles(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchProfilesQueryDto,
  ): Promise<PaginatedResult<SocialProfile>> {
    return this.profiles.search(query, user.id);
  }

  @Get('profiles/availability/:username')
  @ApiOperation({ summary: 'Kullanıcı adının müsait olup olmadığını kontrol eder' })
  checkUsernameAvailability(@Param('username') username: string) {
    return this.profiles.checkUsernameAvailability(username);
  }

  @Public()
  @Get('profiles/:username')
  @ApiOperation({ summary: 'Kullanıcı adına göre sosyal profil' })
  getByUsername(@Param('username') username: string): Promise<SocialProfile> {
    return this.profiles.getByUsername(username);
  }

  @Public()
  @Get('profiles/:username/stories')
  @ApiOperation({ summary: 'Profilin aktif (24 saat) hikâyeleri' })
  listProfileStories(@Param('username') username: string): Promise<{ items: SocialPost[] }> {
    return this.storyHighlights.listActiveStories(username).then((items) => ({ items }));
  }

  @Public()
  @Get('profiles/:username/highlights')
  @ApiOperation({ summary: 'Profilin öne çıkan hikâye koleksiyonları' })
  listProfileHighlights(@Param('username') username: string): Promise<{ items: StoryHighlight[] }> {
    return this.storyHighlights.listByUsername(username).then((items) => ({ items }));
  }

  @Public()
  @Get('profiles/:username/highlights/:highlightId')
  @ApiOperation({ summary: 'Öne çıkan hikâye koleksiyonu detayı' })
  getProfileHighlight(
    @Param('username') username: string,
    @Param('highlightId', ParseUUIDPipe) highlightId: string,
  ): Promise<StoryHighlightDetail> {
    return this.storyHighlights.getDetail(username, highlightId);
  }

  @Post('highlights')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Yeni öne çıkan hikâye koleksiyonu oluştur' })
  createHighlight(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStoryHighlightDto,
  ): Promise<StoryHighlightDetail> {
    return this.storyHighlights.create(user, dto);
  }

  @Patch('highlights/:highlightId')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Öne çıkan hikâye koleksiyonunu güncelle' })
  updateHighlight(
    @CurrentUser() user: AuthenticatedUser,
    @Param('highlightId', ParseUUIDPipe) highlightId: string,
    @Body() dto: UpdateStoryHighlightDto,
  ): Promise<StoryHighlightDetail> {
    return this.storyHighlights.update(user, highlightId, dto);
  }

  @Delete('highlights/:highlightId')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Öne çıkan hikâye koleksiyonunu sil' })
  deleteHighlight(
    @CurrentUser() user: AuthenticatedUser,
    @Param('highlightId', ParseUUIDPipe) highlightId: string,
  ): Promise<void> {
    return this.storyHighlights.delete(user, highlightId);
  }

  @Post('highlights/:highlightId/items')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Öne çıkana hikâye ekle' })
  addHighlightItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('highlightId', ParseUUIDPipe) highlightId: string,
    @Body() dto: AddStoryHighlightItemDto,
  ): Promise<StoryHighlightDetail> {
    return this.storyHighlights.addItem(user, highlightId, dto);
  }

  @Delete('highlights/:highlightId/items/:postId')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Öne çıkandan hikâye kaldır' })
  removeHighlightItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('highlightId', ParseUUIDPipe) highlightId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<StoryHighlightDetail> {
    return this.storyHighlights.removeItem(user, highlightId, postId);
  }

  @Public()
  @Get('profiles/:username/posts')
  @ApiOperation({ summary: 'Profilin gönderilerini listeler' })
  listPostsByUsername(
    @Param('username') username: string,
    @Query() query: ListSocialQueryDto,
  ): Promise<PaginatedResult<SocialPost>> {
    return this.posts.listByUsername(username, query);
  }

  @Post('profiles/:username/follow')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Profili takip et' })
  follow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('username') username: string,
  ): Promise<SocialProfile> {
    return this.follows.follow(user, username);
  }

  @Post('profiles/:username/message')
  @RequirePermissions(Permission.SOCIAL_INTERACT, Permission.MESSAGE_SEND)
  @ApiCreatedResponse({ description: 'Açılan sohbet' })
  @ApiOperation({ summary: 'Profil sahibiyle doğrudan sohbet açar' })
  async messageProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('username') username: string,
  ): Promise<Conversation> {
    const profile = await this.profiles.getByUsername(username);
    const peerUserId = profile.kind === 'BUSINESS' ? profile.business?.ownerUserId : profile.userId;
    if (!peerUserId) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Bu profille mesajlaşılamaz.',
      });
    }
    return this.messages.openDirect(user, peerUserId);
  }

  @Delete('profiles/:username/follow')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Takipten çık' })
  unfollow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('username') username: string,
  ): Promise<SocialProfile> {
    return this.follows.unfollow(user, username);
  }

  @Public()
  @Get('profiles/:username/followers')
  @ApiOperation({ summary: 'Takipçiler' })
  listFollowers(
    @Param('username') username: string,
    @Query() query: ListSocialQueryDto,
  ): Promise<PaginatedResult<SocialProfile>> {
    return this.follows.listFollowers(username, query);
  }

  @Public()
  @Get('profiles/:username/following')
  @ApiOperation({ summary: 'Takip edilenler' })
  listFollowing(
    @Param('username') username: string,
    @Query() query: ListSocialQueryDto,
  ): Promise<PaginatedResult<SocialProfile>> {
    return this.follows.listFollowing(username, query);
  }

  @Post('posts')
  @RequirePermissions(Permission.SOCIAL_POST_CREATE)
  @ApiCreatedResponse({ description: 'Oluşturulan gönderi' })
  @ApiOperation({ summary: 'Gönderi oluştur' })
  createPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ): Promise<SocialPost> {
    return this.posts.create(user, dto);
  }

  @Public()
  @Get('posts/:id')
  @ApiOperation({ summary: 'Gönderi detayı' })
  getPost(@Param('id', ParseUUIDPipe) id: string): Promise<SocialPost> {
    return this.posts.getById(id);
  }

  @Delete('posts/:id')
  @RequirePermissions(Permission.SOCIAL_POST_CREATE)
  @ApiOperation({ summary: 'Kendi gönderisini siler' })
  async deletePost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ ok: true }> {
    await this.posts.delete(user, id);
    return { ok: true };
  }

  @Post('posts/:id/create-request')
  @RequirePermissions(Permission.REQUEST_CREATE, Permission.SOCIAL_INTERACT)
  @ApiCreatedResponse({ description: 'Gönderiden oluşturulan talep' })
  @ApiOperation({ summary: 'SC4 — Posttan CommerceRequest oluştur (RequestsService)' })
  createRequestFromPost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRequestFromPostDto,
  ): Promise<CommerceRequest> {
    return this.bridge.createRequestFromPost(user, id, dto);
  }

  @Post('requests/:requestId/share')
  @RequirePermissions(Permission.SOCIAL_POST_CREATE, Permission.REQUEST_READ_OWN)
  @ApiCreatedResponse({ description: 'REQUEST_SHARE gönderisi' })
  @ApiOperation({ summary: 'SC4 — Talebi akışta paylaş (idempotent)' })
  shareRequestToFeed(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: ShareRequestToFeedDto,
  ): Promise<SocialPost> {
    return this.bridge.shareRequestToFeed(user, requestId, dto);
  }

  @Post('posts/:id/like')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Gönderiyi beğen' })
  like(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SocialPost> {
    return this.interactions.like(user, id);
  }

  @Delete('posts/:id/like')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Beğeniyi kaldır' })
  unlike(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SocialPost> {
    return this.interactions.unlike(user, id);
  }

  @Post('posts/:id/comments')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Yorum yaz' })
  comment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
  ): Promise<SocialPostComment> {
    return this.interactions.comment(user, id, dto);
  }

  @Public()
  @Get('posts/:id/comments')
  @ApiOperation({ summary: 'Yorumları listele' })
  listComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListSocialQueryDto,
  ): Promise<PaginatedResult<SocialPostComment>> {
    return this.interactions.listComments(id, query);
  }

  @Post('posts/:id/save')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Gönderiyi kaydet' })
  save(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SocialPost> {
    return this.interactions.save(user, id);
  }

  @Delete('posts/:id/save')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Kaydı kaldır' })
  unsave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SocialPost> {
    return this.interactions.unsave(user, id);
  }

  @Post('posts/:id/share')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Gönderiyi paylaş (sayacı artırır)' })
  sharePost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SocialPost> {
    return this.interactions.share(user, id);
  }

  // Sabit yol parametreli yoldan önce tanımlanır; aksi hâlde `:id` "views"
  // değerini yakalar ve UUID doğrulaması hata verir.
  @Post('posts/views')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Birden çok gönderi görüntülemesini tek turda kaydeder' })
  recordViews(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecordViewsDto,
  ): Promise<{ recorded: number }> {
    return this.interactions.recordViews(user, dto.postIds);
  }

  @Post('posts/:id/view')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Gönderi görüntülemesini kaydet' })
  recordView(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ recorded: boolean }> {
    return this.interactions.recordView(user, id);
  }

  @Post('posts/:id/hide')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Gönderiyi akıştan gizle' })
  hidePost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ ok: true }> {
    return this.interactions.hide(user, id);
  }

  @Public()
  @Get('hashtags/:slug/posts')
  @ApiOperation({ summary: 'Hashtag gönderilerini listele' })
  listHashtagPosts(
    @Param('slug') slug: string,
    @Query() query: ListSocialQueryDto,
  ): Promise<PaginatedResult<SocialPost>> {
    return this.posts.listByHashtag(slug, query);
  }

  @Get('trending')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOkResponse({ description: 'Gündem hashtag listesi' })
  @ApiOperation({ summary: '24 saatlik gündem (min. 3 benzersiz etkileşim)' })
  listTrending(@Query() query: TrendingQueryDto): Promise<TrendingTopic[]> {
    return this.trending.list(query.limit, {
      cityId: query.cityId,
      categoryId: query.categoryId,
    });
  }

  @Get('feed')
  @RequirePermissions(Permission.SOCIAL_INTERACT, Permission.SOCIAL_POST_CREATE)
  @ApiOkResponse({ description: 'Ana akış' })
  @ApiOperation({ summary: 'Ana sosyal akış' })
  getFeed(@CurrentUser() user: AuthenticatedUser, @Query() query: FeedQueryDto): Promise<FeedPage> {
    return this.feed.getHomeFeed(user, query);
  }

  @Get('discover')
  @RequirePermissions(Permission.SOCIAL_INTERACT, Permission.SOCIAL_POST_CREATE)
  @ApiOkResponse({ description: 'Keşfet akışı' })
  @ApiOperation({ summary: 'SC5 Keşfet — fırsat ve kategori odaklı akış' })
  getDiscover(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DiscoverFeedQueryDto,
  ): Promise<FeedPage> {
    return this.feed.getDiscoverFeed(user, query);
  }

  @Get('categories/following')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Kayıt / ayar ilgi alanları' })
  listCategoryFollows(@CurrentUser() user: AuthenticatedUser): Promise<CategoryFollowItem[]> {
    return this.categoryFollows.listMine(user);
  }

  @Put('interests')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'İlgi alanlarını güncelle (en az 3)' })
  replaceInterests(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ReplaceInterestsDto,
  ): Promise<CategoryFollowItem[]> {
    return this.categoryFollows.replaceForUser(user.id, body.categoryIds);
  }

  @Post('categories/:categoryId/follow')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Kategori takip et' })
  followCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ): Promise<CategoryFollowItem> {
    return this.categoryFollows.follow(user, categoryId);
  }

  @Delete('categories/:categoryId/follow')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Kategori takibini bırak' })
  unfollowCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ): Promise<CategoryFollowItem> {
    return this.categoryFollows.unfollow(user, categoryId);
  }

  @Get('analytics/me')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'SC6 — kendi sosyal analitik özeti' })
  getMyAnalytics(@CurrentUser() user: AuthenticatedUser): Promise<SocialAnalyticsSummary> {
    return this.analytics.getMine(user);
  }

  @Get('analytics/business/:businessId')
  @RequirePermissions(Permission.SOCIAL_PROFILE_MANAGE, Permission.REQUEST_READ_MATCHED)
  @ApiOperation({ summary: 'İşletme sosyal erişim özeti' })
  getBusinessAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ): Promise<SocialAnalyticsSummary> {
    return this.analytics.getForBusiness(user, businessId);
  }

  @Post('reports')
  @RequirePermissions(Permission.SOCIAL_REPORT)
  @ApiOperation({ summary: 'İçerik bildir' })
  report(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateContentReportDto,
  ): Promise<ContentReport> {
    return this.moderation.report(user, dto);
  }

  @Post('blocks/:userId')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Kullanıcıyı engelle' })
  async block(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ ok: true }> {
    await this.moderation.block(user, userId);
    return { ok: true };
  }

  @Delete('blocks/:userId')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Engeli kaldır' })
  async unblock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ ok: true }> {
    await this.moderation.unblock(user, userId);
    return { ok: true };
  }

  @Get('saved')
  @RequirePermissions(Permission.SOCIAL_INTERACT)
  @ApiOperation({ summary: 'Kaydedilen gönderiler' })
  listSaved(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListSocialQueryDto,
  ): Promise<PaginatedResult<SocialPost>> {
    return this.posts.listSaved(user, query);
  }

  @Get('stories')
  @RequirePermissions(Permission.SOCIAL_INTERACT, Permission.SOCIAL_PROFILE_MANAGE)
  @ApiOperation({ summary: 'Takip edilenlerin görselli hikâyeleri' })
  listStories(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ items: SocialPost[]; comingSoon: false }> {
    return this.feed.listStories(user);
  }

  @Get('group-conversations')
  @RequirePermissions(Permission.SOCIAL_INTERACT, Permission.MESSAGE_READ_OWN)
  @ApiOperation({ summary: 'Kullanıcının grup sohbetleri' })
  async listGroupConversations(@CurrentUser() user: AuthenticatedUser) {
    const items = await this.messages.listGroups(user);
    return { items, comingSoon: false as const };
  }

  @Post('group-conversations')
  @RequirePermissions(Permission.SOCIAL_INTERACT, Permission.MESSAGE_SEND)
  @ApiOperation({ summary: 'Yeni grup sohbeti açar' })
  createGroupConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGroupConversationDto,
  ): Promise<Conversation> {
    return this.messages.openGroup(user, dto);
  }

  @Post('group-conversations/:id/members')
  @RequirePermissions(Permission.SOCIAL_INTERACT, Permission.MESSAGE_SEND)
  @ApiOperation({ summary: 'Grup sohbetine kişi ekler' })
  addGroupMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddGroupMembersDto,
  ): Promise<Conversation> {
    return this.messages.addGroupMembers(user, id, dto.memberIds);
  }
}
