import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';
import { VideoGalleryListResult } from '../../interfaces/video-gallery-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 비디오갤러리 목록 조회 쿼리
 */
export class GetVideoGalleryListQuery {
  constructor(
    public readonly isPublic?: boolean,
    public readonly orderBy: 'order' | 'createdAt' = 'order',
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

/**
 * 비디오갤러리 목록 조회 핸들러
 */
@QueryHandler(GetVideoGalleryListQuery)
export class GetVideoGalleryListHandler
  implements IQueryHandler<GetVideoGalleryListQuery>
{
  private readonly logger = new Logger(GetVideoGalleryListHandler.name);

  constructor(
    @InjectRepository(VideoGallery)
    private readonly videoGalleryRepository: Repository<VideoGallery>,
  ) {}

  async execute(query: GetVideoGalleryListQuery): Promise<VideoGalleryListResult> {
    const { isPublic, orderBy, page, limit } = query;

    this.logger.debug(
      `비디오갤러리 목록 조회 - 공개: ${isPublic}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const queryBuilder =
      this.videoGalleryRepository.createQueryBuilder('videoGallery');

    if (isPublic !== undefined) {
      queryBuilder.where('videoGallery.isPublic = :isPublic', { isPublic });
    }

    if (orderBy === 'order') {
      queryBuilder.orderBy('videoGallery.order', 'ASC');
    } else {
      queryBuilder.orderBy('videoGallery.createdAt', 'DESC');
    }

    // 페이지네이션 적용
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, limit };
  }
}
