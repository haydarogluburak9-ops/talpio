import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  UserRole,
  type ProviderProfile,
  type ProviderService,
  type ProviderSummary,
} from '@ustapilot/types';

import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import {
  ReplaceProviderServiceAreasDto,
  ReplaceProviderServicesDto,
  UpdateProviderProfileDto,
} from './dto/provider-profile.dto';
import { ProvidersService } from './providers.service';

@ApiTags('Providers')
@ApiBearerAuth()
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  /**
   * Sabit yollar `:id` parametresinden önce tanımlanmalıdır; aksi halde "me"
   * bir kimlik sanılır.
   */
  @Get('me')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Ustanın kendi profili' })
  @ApiOkResponse({ description: 'Usta profili' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<ProviderProfile> {
    return this.providers.getMe(user);
  }

  @Patch('me')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Ustanın kendi profilini günceller' })
  @ApiOkResponse({ description: 'Güncellenmiş profil' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProviderProfileDto,
  ): Promise<ProviderProfile> {
    return this.providers.updateMe(user, dto);
  }

  @Get('me/services')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Ustanın verdiği hizmetler' })
  @ApiOkResponse({ description: 'Hizmet listesi' })
  listMyServices(@CurrentUser() user: AuthenticatedUser): Promise<ProviderService[]> {
    return this.providers.listMyServices(user);
  }

  @Put('me/services')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Hizmet listesini gönderilen içerikle değiştirir' })
  @ApiOkResponse({ description: 'Güncellenmiş hizmet listesi' })
  replaceMyServices(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplaceProviderServicesDto,
  ): Promise<ProviderService[]> {
    return this.providers.replaceMyServices(user, dto);
  }

  @Put('me/service-areas')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Hizmet bölgelerini gönderilen ilçelerle değiştirir' })
  @ApiOkResponse({ description: 'Güncellenmiş profil' })
  replaceMyServiceAreas(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplaceProviderServiceAreasDto,
  ): Promise<ProviderProfile> {
    return this.providers.replaceMyServiceAreas(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ustanın herkese açık kartı' })
  @ApiOkResponse({ description: 'Usta özeti' })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<ProviderSummary> {
    return this.providers.getPublicById(id);
  }
}
