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
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly categoryId?: string,
  ) {}
}

/**
 * 비디오갤러리 목록 조회 핸들러
 */
@QueryHandler(GetVideoGalleryListQuery)
export class GetVideoGalleryListHandler implements IQueryHandler<GetVideoGalleryListQuery> {
  private readonly logger = new Logger(GetVideoGalleryListHandler.name);

  constructor(
    @InjectRepository(VideoGallery)
    private readonly videoGalleryRepository: Repository<VideoGallery>,
  ) {}

  async execute(
    query: GetVideoGalleryListQuery,
  ): Promise<VideoGalleryListResult> {
    const { isPublic, orderBy, page, limit, startDate, endDate, categoryId } =
      query;

    this.logger.debug(
      `비디오갤러리 목록 조회 - 공개: ${isPublic}, 카테고리: ${categoryId}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const queryBuilder = this.videoGalleryRepository
      .createQueryBuilder('videoGallery')
      .leftJoinAndSelect('videoGallery.category', 'category');

    let hasWhere = false;

    if (isPublic !== undefined) {
      queryBuilder.where('videoGallery.isPublic = :isPublic', { isPublic });
      hasWhere = true;
    }

    if (categoryId) {
      if (hasWhere) {
        queryBuilder.andWhere('videoGallery.categoryId = :categoryId', {
          categoryId,
        });
      } else {
        queryBuilder.where('videoGallery.categoryId = :categoryId', {
          categoryId,
        });
        hasWhere = true;
      }
    }

    if (startDate) {
      if (hasWhere) {
        queryBuilder.andWhere('videoGallery.createdAt >= :startDate', {
          startDate,
        });
      } else {
        queryBuilder.where('videoGallery.createdAt >= :startDate', {
          startDate,
        });
        hasWhere = true;
      }
    }

    if (endDate) {
      if (hasWhere) {
        queryBuilder.andWhere('videoGallery.createdAt <= :endDate', {
          endDate,
        });
      } else {
        queryBuilder.where('videoGallery.createdAt <= :endDate', { endDate });
        hasWhere = true;
      }
    }

    if (orderBy === 'order') {
      queryBuilder.orderBy('videoGallery.order', 'ASC');
    } else {
      queryBuilder.orderBy('videoGallery.createdAt', 'DESC');
    }

    // 페이지네이션 적용
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [rawItems, total] = await queryBuilder.getManyAndCount();

    // deletedAt이 null인 파일만 필터링 (videoSources)
    rawItems.forEach((item) => {
      if (item.videoSources) {
        item.videoSources = item.videoSources.filter(
          (source: any) => source.type === 'youtube' || !source.deletedAt,
        );
      }
    });

    return { items: rawItems, total, page, limit };
  }
}
