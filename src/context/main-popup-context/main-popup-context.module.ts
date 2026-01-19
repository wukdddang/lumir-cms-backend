import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MainPopupContextService } from './main-popup-context.service';
import { MainPopupModule } from '@domain/sub/main-popup/main-popup.module';
import { LanguageModule } from '@domain/common/language/language.module';
import { MainPopupTranslation } from '@domain/sub/main-popup/main-popup-translation.entity';
import { SyncMainPopupTranslationsHandler } from './handlers';
import { MainPopupSyncScheduler } from './main-popup-sync.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([MainPopupTranslation]),
    MainPopupModule,
    LanguageModule,
  ],
  providers: [
    MainPopupContextService,
    SyncMainPopupTranslationsHandler,
    MainPopupSyncScheduler,
  ],
  exports: [MainPopupContextService],
})
export class MainPopupContextModule {}
