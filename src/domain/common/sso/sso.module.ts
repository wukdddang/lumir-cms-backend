import { Module } from '@nestjs/common';
import { SsoService } from './sso.service';

/**
 * SSO 서비스 모듈
 * 
 * SSO API 연동을 담당합니다.
 */
@Module({
  providers: [SsoService],
  exports: [SsoService],
})
export class SsoModule {}
