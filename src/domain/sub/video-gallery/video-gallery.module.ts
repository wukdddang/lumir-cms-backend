import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoGallery } from './video-gallery.entity';
import { VideoGalleryService } from './video-gallery.service';

/**
 * 비디오갤러리 모듈
 * 비디오갤러리 관리 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([VideoGallery])],
  providers: [VideoGalleryService],
  exports: [VideoGalleryService],
})
export class VideoGalleryModule {}
