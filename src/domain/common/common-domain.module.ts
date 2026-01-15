import { Module } from '@nestjs/common';
import { LanguageModule } from './language/language.module';
import { CategoryModule } from './category/category.module';
import { SsoModule } from './sso/sso.module';

/**
 * Common Domain 통합 모듈
 * 공통 도메인의 모든 모듈을 통합합니다.
 * - Category: 카테고리 관리
 * - Language: 다국어 언어 관리
 * - Sso: SSO API 연동 (조직 정보, FCM 토큰)
 */
@Module({
  imports: [LanguageModule, CategoryModule, SsoModule],
  exports: [LanguageModule, CategoryModule, SsoModule],
})
export class CommonDomainModule {}
