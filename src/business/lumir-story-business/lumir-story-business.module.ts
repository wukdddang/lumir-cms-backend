import { Module } from '@nestjs/common';
import { LumirStoryContextModule } from '@context/lumir-story-context/lumir-story-context.module';
import { CategoryModule } from '@domain/common/category/category.module';
import { StorageModule } from '@libs/storage/storage.module';
import { LumirStoryBusinessService } from './lumir-story-business.service';

/**
 * 루미르스토리 비즈니스 모듈
 * 루미르스토리 관련 비즈니스 로직 오케스트레이션을 제공합니다.
 */
@Module({
  imports: [LumirStoryContextModule, CategoryModule, StorageModule],
  providers: [LumirStoryBusinessService],
  exports: [LumirStoryBusinessService],
})
export class LumirStoryBusinessModule {}
