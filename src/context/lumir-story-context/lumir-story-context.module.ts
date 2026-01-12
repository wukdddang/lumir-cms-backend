import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';
import { LumirStoryModule } from '@domain/sub/lumir-story/lumir-story.module';
import { LumirStoryContextService } from './lumir-story-context.service';
import {
  CreateLumirStoryHandler,
  UpdateLumirStoryHandler,
  DeleteLumirStoryHandler,
  UpdateLumirStoryPublicHandler,
  UpdateLumirStoryBatchOrderHandler,
  UpdateLumirStoryFileHandler,
  GetLumirStoryListHandler,
  GetLumirStoryDetailHandler,
} from './handlers';

const commandHandlers = [
  CreateLumirStoryHandler,
  UpdateLumirStoryHandler,
  DeleteLumirStoryHandler,
  UpdateLumirStoryPublicHandler,
  UpdateLumirStoryBatchOrderHandler,
  UpdateLumirStoryFileHandler,
];

const queryHandlers = [GetLumirStoryListHandler, GetLumirStoryDetailHandler];

/**
 * 루미르스토리 컨텍스트 모듈
 * 루미르스토리 관련 CQRS 핸들러 및 서비스를 제공합니다.
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([LumirStory]),
    LumirStoryModule,
  ],
  providers: [
    LumirStoryContextService,
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [LumirStoryContextService],
})
export class LumirStoryContextModule {}
