import { Module } from '@nestjs/common';
import { NewsContextModule } from '@context/news-context/news-context.module';
import { CategoryModule } from '@domain/common/category/category.module';
import { StorageModule } from '@libs/storage/storage.module';
import { NewsBusinessService } from './news-business.service';

/**
 * 뉴스 비즈니스 모듈
 * 뉴스 관련 비즈니스 로직 오케스트레이션을 제공합니다.
 */
@Module({
  imports: [NewsContextModule, CategoryModule, StorageModule],
  providers: [NewsBusinessService],
  exports: [NewsBusinessService],
})
export class NewsBusinessModule {}
