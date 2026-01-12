import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoGallery } from './video-gallery.entity';
import { ContentStatus } from '../../core/content-status.types';

/**
 * 비디오갤러리 서비스
 * 비디오갤러리 관리 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class VideoGalleryService {
  private readonly logger = new Logger(VideoGalleryService.name);

  constructor(
    @InjectRepository(VideoGallery)
    private readonly videoGalleryRepository: Repository<VideoGallery>,
  ) {}

  /**
   * 비디오갤러리를 생성한다
   */
  async 비디오갤러리를_생성한다(data: Partial<VideoGallery>): Promise<VideoGallery> {
    this.logger.log(`비디오갤러리 생성 시작`);

    const videoGallery = this.videoGalleryRepository.create(data);
    const saved = await this.videoGalleryRepository.save(videoGallery);

    this.logger.log(`비디오갤러리 생성 완료 - ID: ${saved.id}`);
    return saved;
  }

  /**
   * 모든 비디오갤러리를 조회한다
   */
  async 모든_비디오갤러리를_조회한다(options?: {
    status?: ContentStatus;
    isPublic?: boolean;
    orderBy?: 'order' | 'createdAt';
  }): Promise<VideoGallery[]> {
    this.logger.debug(`비디오갤러리 목록 조회`);

    const queryBuilder =
      this.videoGalleryRepository.createQueryBuilder('videoGallery');

    if (options?.status) {
      queryBuilder.where('videoGallery.status = :status', {
        status: options.status,
      });
    }

    if (options?.isPublic !== undefined) {
      queryBuilder.andWhere('videoGallery.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
    }

    const orderBy = options?.orderBy || 'order';
    if (orderBy === 'order') {
      queryBuilder.orderBy('videoGallery.order', 'ASC');
    } else {
      queryBuilder.orderBy('videoGallery.createdAt', 'DESC');
    }

    return await queryBuilder.getMany();
  }

  /**
   * ID로 비디오갤러리를 조회한다
   */
  async ID로_비디오갤러리를_조회한다(id: string): Promise<VideoGallery> {
    this.logger.debug(`비디오갤러리 조회 - ID: ${id}`);

    const videoGallery = await this.videoGalleryRepository.findOne({
      where: { id },
    });

    if (!videoGallery) {
      throw new NotFoundException(`비디오갤러리를 찾을 수 없습니다. ID: ${id}`);
    }

    return videoGallery;
  }

  /**
   * 비디오갤러리를 업데이트한다
   */
  async 비디오갤러리를_업데이트한다(
    id: string,
    data: Partial<VideoGallery>,
  ): Promise<VideoGallery> {
    this.logger.log(`비디오갤러리 업데이트 시작 - ID: ${id}`);

    const videoGallery = await this.ID로_비디오갤러리를_조회한다(id);

    Object.assign(videoGallery, data);

    const updated = await this.videoGalleryRepository.save(videoGallery);

    this.logger.log(`비디오갤러리 업데이트 완료 - ID: ${id}`);
    return updated;
  }

  /**
   * 비디오갤러리를 삭제한다 (Soft Delete)
   */
  async 비디오갤러리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`비디오갤러리 삭제 시작 - ID: ${id}`);

    const videoGallery = await this.ID로_비디오갤러리를_조회한다(id);

    await this.videoGalleryRepository.softRemove(videoGallery);

    this.logger.log(`비디오갤러리 삭제 완료 - ID: ${id}`);
    return true;
  }

  /**
   * 비디오갤러리 상태를 변경한다
   */
  async 비디오갤러리_상태를_변경한다(
    id: string,
    status: ContentStatus,
    updatedBy?: string,
  ): Promise<VideoGallery> {
    this.logger.log(`비디오갤러리 상태 변경 - ID: ${id}, 상태: ${status}`);

    return await this.비디오갤러리를_업데이트한다(id, { status, updatedBy });
  }

  /**
   * 비디오갤러리 공개 여부를 변경한다
   */
  async 비디오갤러리_공개_여부를_변경한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<VideoGallery> {
    this.logger.log(`비디오갤러리 공개 여부 변경 - ID: ${id}, 공개: ${isPublic}`);

    return await this.비디오갤러리를_업데이트한다(id, { isPublic, updatedBy });
  }

  /**
   * 다음 순서 번호를 계산한다
   */
  async 다음_순서를_계산한다(): Promise<number> {
    const maxOrderVideoGalleries = await this.videoGalleryRepository.find({
      order: { order: 'DESC' },
      select: ['order'],
      take: 1,
    });

    return maxOrderVideoGalleries.length > 0
      ? maxOrderVideoGalleries[0].order + 1
      : 0;
  }

  /**
   * 공개된 비디오갤러리를 조회한다
   */
  async 공개된_비디오갤러리를_조회한다(): Promise<VideoGallery[]> {
    this.logger.debug(`공개된 비디오갤러리 조회`);

    return await this.videoGalleryRepository.find({
      where: {
        isPublic: true,
        status: ContentStatus.OPENED,
      },
      order: {
        order: 'ASC',
      },
    });
  }

  /**
   * 비디오갤러리 오더를 일괄 업데이트한다
   */
  async 비디오갤러리_오더를_일괄_업데이트한다(
    items: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `비디오갤러리 오더 일괄 업데이트 시작 - ${items.length}개`,
    );

    let updatedCount = 0;

    for (const item of items) {
      try {
        await this.비디오갤러리를_업데이트한다(item.id, {
          order: item.order,
          updatedBy,
        });
        updatedCount++;
      } catch (error) {
        this.logger.error(
          `비디오갤러리 오더 업데이트 실패 - ID: ${item.id}`,
          error,
        );
      }
    }

    this.logger.log(
      `비디오갤러리 오더 일괄 업데이트 완료 - ${updatedCount}/${items.length}개 성공`,
    );

    return {
      success: updatedCount === items.length,
      updatedCount,
    };
  }
}
