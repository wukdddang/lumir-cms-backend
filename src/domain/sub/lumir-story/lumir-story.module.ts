import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LumirStory } from './lumir-story.entity';
import { LumirStoryService } from './lumir-story.service';

/**
 * 루미르스토리 모듈
 * 루미르스토리 관리 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([LumirStory])],
  providers: [LumirStoryService],
  exports: [LumirStoryService],
})
export class LumirStoryModule {}
