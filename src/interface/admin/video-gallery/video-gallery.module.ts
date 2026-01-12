import { Module } from '@nestjs/common';
import { VideoGalleryBusinessModule } from '@business/video-gallery-business/video-gallery-business.module';
import { VideoGalleryController } from './video-gallery.controller';

/**
 * 비디오갤러리 관리자 인터페이스 모듈
 * 비디오갤러리 관리 엔드포인트를 제공합니다.
 */
@Module({
  imports: [VideoGalleryBusinessModule],
  controllers: [VideoGalleryController],
})
export class AdminVideoGalleryModule {}
