import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import { BrochureContextService } from './brochure-context.service';
import {
  CreateBrochureHandler,
  UpdateBrochureHandler,
  DeleteBrochureHandler,
  UpdateBrochurePublicHandler,
  UpdateBrochureOrderHandler,
  UpdateBrochureFileHandler,
  GetBrochureListHandler,
  GetBrochureDetailHandler,
} from './handlers';

/**
 * 브로슈어 컨텍스트 모듈
 *
 * 브로슈어 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Brochure, BrochureTranslation]),
  ],
  providers: [
    BrochureContextService,
    CreateBrochureHandler,
    UpdateBrochureHandler,
    DeleteBrochureHandler,
    UpdateBrochurePublicHandler,
    UpdateBrochureOrderHandler,
    UpdateBrochureFileHandler,
    GetBrochureListHandler,
    GetBrochureDetailHandler,
  ],
  exports: [BrochureContextService],
})
export class BrochureContextModule {}
