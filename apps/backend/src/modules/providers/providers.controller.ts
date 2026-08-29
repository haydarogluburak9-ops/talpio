import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  MARKETPLACE_ROLES,
  type ProviderProfile,
  type ProviderService,
  type ProviderSummary,
  type Review,
} from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Public } from '@modules/auth/decorators/public.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { ListProviderReviewsQueryDto } from '@modules/reviews/dto/list-reviews-query.dto';
import { ReviewsService } from '@modules/reviews/reviews.service';

import {
  ReplaceProviderServiceAreasDto,
  ReplaceProviderServicesDto,
  UpdateProviderProfileDto,
  UploadProviderDocumentDto,
} from './dto/provider-profile.dto';
import { ProvidersService } from './providers.service';

@ApiTags('Providers')
@ApiBearerAuth()
@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly providers: ProvidersService,
    private readonly reviews: ReviewsService,
  ) {}

  /**
   * Sabit yollar `:id` parametresinden önce tanımlanmalıdır; aksi halde "me"
   * bir kimlik sanılır.
   */
  @Get('me')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Satıcının kendi profili' })
  @ApiOkResponse({ description: 'Satıcı profili' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<ProviderProfile> {
    return this.providers.getMe(user);
  }

  @Patch('me')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Satıcının kendi profilini günceller' })
  @ApiOkResponse({ description: 'Güncellenmiş profil' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProviderProfileDto,
  ): Promise<ProviderProfile> {
    return this.providers.updateMe(user, dto);
  }

  @Get('me/services')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Satıcının verdiği hizmetler' })
  @ApiOkResponse({ description: 'Hizmet listesi' })
  listMyServices(@CurrentUser() user: AuthenticatedUser): Promise<ProviderService[]> {
    return this.providers.listMyServices(user);
  }

  @Put('me/services')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Hizmet listesini gönderilen içerikle değiştirir' })
  @ApiOkResponse({ description: 'Güncellenmiş hizmet listesi' })
  replaceMyServices(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplaceProviderServicesDto,
  ): Promise<ProviderService[]> {
    return this.providers.replaceMyServices(user, dto);
  }

  @Put('me/service-areas')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Hizmet bölgelerini gönderilen ilçelerle değiştirir' })
  @ApiOkResponse({ description: 'Güncellenmiş profil' })
  replaceMyServiceAreas(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplaceProviderServiceAreasDto,
  ): Promise<ProviderProfile> {
    return this.providers.replaceMyServiceAreas(user, dto);
  }

  @Get('me/documents')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Kuruluş belgelerini ve ülke paketini listeler' })
  listMyDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.providers.listMyDocuments(user);
  }

  @Post('me/documents')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Kuruluş belgesi yükler ve incelemeye gönderir' })
  uploadDocument(@CurrentUser() user: AuthenticatedUser, @Body() dto: UploadProviderDocumentDto) {
    return this.providers.uploadDocument(user, dto);
  }

  /** Kart ve yorumlar aynı sayfada durur; biri ziyaretçiye açıksa diğeri de açık olmalı. */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Satıcının herkese açık kartı' })
  @ApiOkResponse({ description: 'Satıcı özeti' })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<ProviderSummary> {
    return this.providers.getPublicById(id);
  }

  /**
   * Yorumlar satıcı kartının bir parçası olduğu için değerlendirme modülü yerine
   * burada durur; ziyaretçi profili görebiliyorsa yorumları da görebilmelidir.
   */
  @Get(':id/reviews')
  @Public()
  @ApiOperation({ summary: 'Satıcının herkese açık değerlendirmeleri' })
  @ApiOkResponse({ description: 'Sayfalı değerlendirme listesi' })
  listReviews(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListProviderReviewsQueryDto,
  ): Promise<PaginatedResult<Review>> {
    return this.reviews.listForProvider(id, query);
  }
}
