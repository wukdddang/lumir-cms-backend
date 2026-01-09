import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from '@domain/common/language/language.entity';
import { LanguageContextService } from './language-context.service';
import {
  CreateLanguageHandler,
  UpdateLanguageHandler,
  DeleteLanguageHandler,
  GetLanguageListHandler,
  GetLanguageDetailHandler,
} from './handlers';

/**
 * 언어 컨텍스트 모듈
 *
 * 언어 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Language]),
  ],
  providers: [
    LanguageContextService,
    CreateLanguageHandler,
    UpdateLanguageHandler,
    DeleteLanguageHandler,
    GetLanguageListHandler,
    GetLanguageDetailHandler,
  ],
  exports: [LanguageContextService],
})
export class LanguageContextModule {}
