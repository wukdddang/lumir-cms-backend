import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectronicDisclosureContextService } from './electronic-disclosure-context.service';
import { ElectronicDisclosureModule } from '@domain/core/electronic-disclosure/electronic-disclosure.module';
import { LanguageModule } from '@domain/common/language/language.module';
import { ElectronicDisclosureTranslation } from '@domain/core/electronic-disclosure/electronic-disclosure-translation.entity';
import {
  SyncElectronicDisclosureTranslationsHandler,
  ElectronicDisclosureTranslationUpdatedHandler,
} from './handlers';
import { ElectronicDisclosureSyncScheduler } from './electronic-disclosure-sync.scheduler';

/**
 * 전자공시 컨텍스트 모듈
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ElectronicDisclosureTranslation]),
    ElectronicDisclosureModule,
    LanguageModule,
  ],
  providers: [
    ElectronicDisclosureContextService,
    SyncElectronicDisclosureTranslationsHandler,
    ElectronicDisclosureTranslationUpdatedHandler,
    ElectronicDisclosureSyncScheduler,
  ],
  exports: [ElectronicDisclosureContextService],
})
export class ElectronicDisclosureContextModule {}
