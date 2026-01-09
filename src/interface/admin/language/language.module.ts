import { Module } from '@nestjs/common';
import { LanguageBusinessModule } from '@business/language-business/language-business.module';
import { LanguageController } from './language.controller';

/**
 * 언어 인터페이스 모듈
 */
@Module({
  imports: [LanguageBusinessModule],
  controllers: [LanguageController],
})
export class LanguageInterfaceModule {}
