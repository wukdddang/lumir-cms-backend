import { Module } from '@nestjs/common';
import { LanguageContextModule } from '@context/language-context/language-context.module';
import { LanguageBusinessService } from './language-business.service';

/**
 * 언어 비즈니스 모듈
 * 
 * Business → Context → Domain 아키텍처를 따름
 * Domain 레이어에 직접 의존하지 않음
 */
@Module({
  imports: [LanguageContextModule],
  providers: [LanguageBusinessService],
  exports: [LanguageBusinessService],
})
export class LanguageBusinessModule {}
