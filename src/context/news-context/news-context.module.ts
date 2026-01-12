import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from '@domain/core/news/news.entity';
import { NewsModule } from '@domain/core/news/news.module';
import { NewsContextService } from './news-context.service';
import {
  CreateNewsHandler,
  UpdateNewsHandler,
  DeleteNewsHandler,
  UpdateNewsPublicHandler,
  UpdateNewsBatchOrderHandler,
  UpdateNewsFileHandler,
  GetNewsListHandler,
  GetNewsDetailHandler,
} from './handlers';

const commandHandlers = [
  CreateNewsHandler,
  UpdateNewsHandler,
  DeleteNewsHandler,
  UpdateNewsPublicHandler,
  UpdateNewsBatchOrderHandler,
  UpdateNewsFileHandler,
];

const queryHandlers = [GetNewsListHandler, GetNewsDetailHandler];

/**
 * 뉴스 컨텍스트 모듈
 * 뉴스 관련 CQRS 핸들러 및 서비스를 제공합니다.
 */
@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([News]), NewsModule],
  providers: [NewsContextService, ...commandHandlers, ...queryHandlers],
  exports: [NewsContextService],
})
export class NewsContextModule {}
