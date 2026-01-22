import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MainPopupContextService } from './main-popup-context.service';
import { MainPopupModule } from '@domain/sub/main-popup/main-popup.module';
import { LanguageModule } from '@domain/common/language/language.module';
import { MainPopup } from '@domain/sub/main-popup/main-popup.entity';
import { MainPopupTranslation } from '@domain/sub/main-popup/main-popup-translation.entity';
import {
  SyncMainPopupTranslationsHandler,
  MainPopupTranslationUpdatedHandler,
} from './handlers';
import { MainPopupSyncScheduler } from './main-popup-sync.scheduler';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([MainPopup, MainPopupTranslation]),
    MainPopupModule,
    LanguageModule,
  ],
  providers: [
    MainPopupContextService,
    SyncMainPopupTranslationsHandler,
    MainPopupTranslationUpdatedHandler,
    MainPopupSyncScheduler,
  ],
  exports: [MainPopupContextService],
})
export class MainPopupContextModule {}
