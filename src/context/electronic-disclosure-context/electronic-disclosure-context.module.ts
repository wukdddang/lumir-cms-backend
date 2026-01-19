import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectronicDisclosureContextService } from './electronic-disclosure-context.service';
import { ElectronicDisclosureModule } from '@domain/core/electronic-disclosure/electronic-disclosure.module';
import { LanguageModule } from '@domain/common/language/language.module';
import { ElectronicDisclosureTranslation } from '@domain/core/electronic-disclosure/electronic-disclosure-translation.entity';
import { SyncElectronicDisclosureTranslationsHandler } from './handlers';
import { ElectronicDisclosureSyncScheduler } from './electronic-disclosure-sync.scheduler';

/**
 * 전자공시 컨텍스트 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ElectronicDisclosureTranslation]),
    ElectronicDisclosureModule,
    LanguageModule,
  ],
  providers: [
    ElectronicDisclosureContextService,
    SyncElectronicDisclosureTranslationsHandler,
    ElectronicDisclosureSyncScheduler,
  ],
  exports: [ElectronicDisclosureContextService],
})
export class ElectronicDisclosureContextModule {}
