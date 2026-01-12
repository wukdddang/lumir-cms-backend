import { Module } from '@nestjs/common';
import { VideoGalleryContextModule } from '@context/video-gallery-context/video-gallery-context.module';
import { CategoryModule } from '@domain/common/category/category.module';
import { StorageModule } from '@libs/storage/storage.module';
import { VideoGalleryBusinessService } from './video-gallery-business.service';

/**
 * 비디오갤러리 비즈니스 모듈
 * 비디오갤러리 관련 비즈니스 로직 오케스트레이션을 제공합니다.
 */
@Module({
  imports: [VideoGalleryContextModule, CategoryModule, StorageModule],
  providers: [VideoGalleryBusinessService],
  exports: [VideoGalleryBusinessService],
})
export class VideoGalleryBusinessModule {}
