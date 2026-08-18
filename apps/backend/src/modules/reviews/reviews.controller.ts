import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MARKETPLACE_ROLES, type Review } from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { CreateReviewDto, ReplyToReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Tamamlanmış bir iş için değerlendirme oluşturur' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReviewDto): Promise<Review> {
    return this.reviews.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Oturumdaki tarafın değerlendirmelerini listeler' })
  @ApiOkResponse({ description: 'Sayfalı değerlendirme listesi' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListReviewsQueryDto,
  ): Promise<PaginatedResult<Review>> {
    return this.reviews.listMine(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tek bir değerlendirmeyi getirir' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Review> {
    return this.reviews.getById(user, id);
  }

  @Post(':id/reply')
  @Roles(...MARKETPLACE_ROLES)
  @ApiOperation({ summary: 'Satıcı aldığı değerlendirmeye cevap yazar' })
  reply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplyToReviewDto,
  ): Promise<Review> {
    return this.reviews.reply(user, id, dto);
  }
}
