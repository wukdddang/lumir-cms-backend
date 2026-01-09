import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthContextService } from './auth-context.service';
import { UserCacheService } from './user-cache.service';
import { LoginHandler, VerifyTokenHandler } from './handlers';

/**
 * 인증 컨텍스트 모듈
 *
 * SSO 서버를 통한 인증 및 토큰 검증을 담당합니다.
 */
@Module({
  imports: [
    HttpModule,
    ConfigModule,
    JwtModule.register({
      secret: 'not-used-for-verification', // 디코딩만 하므로 실제 secret은 불필요
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [
    AuthContextService,
    UserCacheService,
    LoginHandler,
    VerifyTokenHandler,
  ],
  exports: [AuthContextService],
})
export class AuthContextModule {}
