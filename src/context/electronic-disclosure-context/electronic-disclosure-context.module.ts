import { Module } from '@nestjs/common';
import { ElectronicDisclosureContextService } from './electronic-disclosure-context.service';
import { ElectronicDisclosureModule } from '@domain/core/electronic-disclosure/electronic-disclosure.module';
import { LanguageModule } from '@domain/common/language/language.module';

/**
 * 전자공시 컨텍스트 모듈
 */
@Module({
  imports: [ElectronicDisclosureModule, LanguageModule],
  providers: [ElectronicDisclosureContextService],
  exports: [ElectronicDisclosureContextService],
})
export class ElectronicDisclosureContextModule {}
