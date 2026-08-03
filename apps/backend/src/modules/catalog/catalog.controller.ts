import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { ServiceCategory } from '@ustapilot/types';

import { Public } from '@modules/auth/decorators/public.decorator';

import { CatalogService } from './catalog.service';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';

@ApiTags('Catalog')
@Public()
@Controller('categories')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Hizmet kategorilerini listeler' })
  @ApiQuery({ name: 'withSubcategories', required: false, type: Boolean })
  @ApiOkResponse({ description: 'Sıralanmış kategori listesi' })
  list(@Query() query: ListCategoriesQueryDto): Promise<ServiceCategory[]> {
    return this.catalog.listCategories({
      withSubcategories: query.withSubcategories,
    });
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Tek bir kategoriyi alt kategorileriyle getirir' })
  getBySlug(@Param('slug') slug: string): Promise<ServiceCategory> {
    return this.catalog.getCategoryBySlug(slug);
  }
}
