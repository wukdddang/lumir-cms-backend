import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { VideoGalleryService } from '@domain/sub/video-gallery/video-gallery.service';
import { VideoGalleryDetailResult } from '../../interfaces/video-gallery-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 비디오갤러리 상세 조회 쿼리
 */
export class GetVideoGalleryDetailQuery {
  constructor(public readonly id: string) {}
}

/**
 * 비디오갤러리 상세 조회 핸들러
 */
@QueryHandler(GetVideoGalleryDetailQuery)
export class GetVideoGalleryDetailHandler
  implements IQueryHandler<GetVideoGalleryDetailQuery>
{
  private readonly logger = new Logger(GetVideoGalleryDetailHandler.name);

  constructor(private readonly videoGalleryService: VideoGalleryService) {}

  async execute(
    query: GetVideoGalleryDetailQuery,
  ): Promise<VideoGalleryDetailResult> {
    const { id } = query;

    this.logger.debug(`비디오갤러리 상세 조회 - ID: ${id}`);

    const videoGallery = await this.videoGalleryService.ID로_비디오갤러리를_조회한다(
      id,
    );

    return videoGallery;
  }
}
