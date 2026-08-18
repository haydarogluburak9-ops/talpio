import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CurrentUser as CurrentUserPayload } from '@talpio/types';

import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Oturum açmış kullanıcının profili' })
  @ApiOkResponse({ description: 'Kullanıcı profili' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<CurrentUserPayload> {
    return this.users.getMe(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Kendi profilini günceller' })
  @ApiOkResponse({ description: 'Güncellenmiş profil' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<CurrentUserPayload> {
    return this.users.updateMe(user, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hesabı kalıcı olarak kapatır (mağaza silme)' })
  @ApiNoContentResponse({ description: 'Hesap kapatıldı' })
  async deleteMe(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.users.deleteMe(user);
  }
}
