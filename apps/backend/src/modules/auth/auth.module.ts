import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppConfigModule } from '@config/config.module';
import { SocialModule } from '@modules/social/social.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { VerificationService } from './verification.service';

@Module({
  imports: [
    AppConfigModule,
    SocialModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    // Gizli anahtar imzalama anında verilir; erişim ve yenileme jetonları
    // farklı anahtarlar kullandığı için modül düzeyinde sabitlenmez.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, JwtStrategy, VerificationService],
  exports: [AuthService, TokenService, PasswordService, VerificationService],
})
export class AuthModule {}
