import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import { BrochureModule } from '@domain/core/brochure/brochure.module';
import { LanguageModule } from '@domain/common/language/language.module';
import { BrochureContextService } from './brochure-context.service';
import {
  CreateBrochureHandler,
  UpdateBrochureHandler,
  DeleteBrochureHandler,
  UpdateBrochurePublicHandler,
  UpdateBrochureBatchOrderHandler,
  UpdateBrochureFileHandler,
  GetBrochureListHandler,
  GetBrochureDetailHandler,
  InitializeDefaultBrochuresHandler,
  UpdateBrochureTranslationsHandler,
  SyncBrochureTranslationsHandler,
  BrochureTranslationUpdatedHandler,
} from './handlers';
import { BrochureSyncScheduler } from './brochure-sync.scheduler';

/**
 * 브로슈어 컨텍스트 모듈
 *
 * 브로슈어 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Brochure, BrochureTranslation]),
    BrochureModule,
    LanguageModule,
  ],
  providers: [
    BrochureContextService,
    CreateBrochureHandler,
    UpdateBrochureHandler,
    DeleteBrochureHandler,
    UpdateBrochurePublicHandler,
    UpdateBrochureBatchOrderHandler,
    UpdateBrochureFileHandler,
    GetBrochureListHandler,
    GetBrochureDetailHandler,
    InitializeDefaultBrochuresHandler,
    UpdateBrochureTranslationsHandler,
    SyncBrochureTranslationsHandler,
    BrochureTranslationUpdatedHandler,
    BrochureSyncScheduler,
  ],
  exports: [BrochureContextService],
})
export class BrochureContextModule {}
