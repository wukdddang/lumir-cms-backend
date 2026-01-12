import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';
import { VideoGalleryModule } from '@domain/sub/video-gallery/video-gallery.module';
import { VideoGalleryContextService } from './video-gallery-context.service';
import {
  CreateVideoGalleryHandler,
  UpdateVideoGalleryHandler,
  DeleteVideoGalleryHandler,
  UpdateVideoGalleryPublicHandler,
  UpdateVideoGalleryBatchOrderHandler,
  UpdateVideoGalleryFileHandler,
  GetVideoGalleryListHandler,
  GetVideoGalleryDetailHandler,
} from './handlers';

const commandHandlers = [
  CreateVideoGalleryHandler,
  UpdateVideoGalleryHandler,
  DeleteVideoGalleryHandler,
  UpdateVideoGalleryPublicHandler,
  UpdateVideoGalleryBatchOrderHandler,
  UpdateVideoGalleryFileHandler,
];

const queryHandlers = [GetVideoGalleryListHandler, GetVideoGalleryDetailHandler];

/**
 * 비디오갤러리 컨텍스트 모듈
 * 비디오갤러리 관련 CQRS 핸들러 및 서비스를 제공합니다.
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([VideoGallery]),
    VideoGalleryModule,
  ],
  providers: [
    VideoGalleryContextService,
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [VideoGalleryContextService],
})
export class VideoGalleryContextModule {}
