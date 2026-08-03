import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UPLOAD } from '@ustapilot/config';
import type { FileAsset } from '@ustapilot/types';

import { AppException } from '@common/errors/app.exception';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { UploadFileDto } from './dto/upload-file.dto';
import { FilesService } from './files.service';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Dosya yükler ve üst verisini döner' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'purpose'],
      properties: {
        file: { type: 'string', format: 'binary' },
        purpose: { type: 'string' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Yüklenen dosyanın üst verisi' })
  // Sınır burada da uygulanır: tür bazlı kontrol servistedir, buradaki çatı sınırı
  // aşırı büyük gövdenin belleğe alınmasını engeller.
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: UPLOAD.maxImageSizeBytes, files: 1 } }),
  )
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadFileDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<FileAsset> {
    if (!file) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Yüklenecek dosya bulunamadı.',
        details: [{ field: 'file', issue: 'Dosya alanı zorunludur' }],
      });
    }

    return this.files.upload(user, dto.purpose, {
      buffer: file.buffer,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      ...(file.originalname ? { originalName: file.originalname } : {}),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dosyanın erişim adresini döner' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FileAsset> {
    return this.files.getById(user, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Henüz bir kayda bağlanmamış dosyayı siler' })
  @ApiNoContentResponse({ description: 'Dosya silindi' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.files.remove(user, id);
  }
}
