import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LumirStory } from './lumir-story.entity';
import { ContentStatus } from '../../core/content-status.types';

/**
 * 루미르스토리 서비스
 * 루미르스토리 관리 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class LumirStoryService {
  private readonly logger = new Logger(LumirStoryService.name);

  constructor(
    @InjectRepository(LumirStory)
    private readonly lumirStoryRepository: Repository<LumirStory>,
  ) {}

  /**
   * 루미르스토리를 생성한다
   */
  async 루미르스토리를_생성한다(data: Partial<LumirStory>): Promise<LumirStory> {
    this.logger.log(`루미르스토리 생성 시작`);

    const lumirStory = this.lumirStoryRepository.create(data);
    const saved = await this.lumirStoryRepository.save(lumirStory);

    this.logger.log(`루미르스토리 생성 완료 - ID: ${saved.id}`);
    return saved;
  }

  /**
   * 모든 루미르스토리를 조회한다
   */
  async 모든_루미르스토리를_조회한다(options?: {
    status?: ContentStatus;
    isPublic?: boolean;
    orderBy?: 'order' | 'createdAt';
  }): Promise<LumirStory[]> {
    this.logger.debug(`루미르스토리 목록 조회`);

    const queryBuilder =
      this.lumirStoryRepository.createQueryBuilder('lumirStory');

    if (options?.status) {
      queryBuilder.where('lumirStory.status = :status', {
        status: options.status,
      });
    }

    if (options?.isPublic !== undefined) {
      queryBuilder.andWhere('lumirStory.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
    }

    const orderBy = options?.orderBy || 'order';
    if (orderBy === 'order') {
      queryBuilder.orderBy('lumirStory.order', 'ASC');
    } else {
      queryBuilder.orderBy('lumirStory.createdAt', 'DESC');
    }

    return await queryBuilder.getMany();
  }

  /**
   * ID로 루미르스토리를 조회한다
   */
  async ID로_루미르스토리를_조회한다(id: string): Promise<LumirStory> {
    this.logger.debug(`루미르스토리 조회 - ID: ${id}`);

    const lumirStory = await this.lumirStoryRepository.findOne({
      where: { id },
    });

    if (!lumirStory) {
      throw new NotFoundException(`루미르스토리를 찾을 수 없습니다. ID: ${id}`);
    }

    return lumirStory;
  }

  /**
   * 루미르스토리를 업데이트한다
   */
  async 루미르스토리를_업데이트한다(
    id: string,
    data: Partial<LumirStory>,
  ): Promise<LumirStory> {
    this.logger.log(`루미르스토리 업데이트 시작 - ID: ${id}`);

    const lumirStory = await this.ID로_루미르스토리를_조회한다(id);

    Object.assign(lumirStory, data);

    const updated = await this.lumirStoryRepository.save(lumirStory);

    this.logger.log(`루미르스토리 업데이트 완료 - ID: ${id}`);
    return updated;
  }

  /**
   * 루미르스토리를 삭제한다 (Soft Delete)
   */
  async 루미르스토리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`루미르스토리 삭제 시작 - ID: ${id}`);

    const lumirStory = await this.ID로_루미르스토리를_조회한다(id);

    await this.lumirStoryRepository.softRemove(lumirStory);

    this.logger.log(`루미르스토리 삭제 완료 - ID: ${id}`);
    return true;
  }

  /**
   * 루미르스토리 상태를 변경한다
   */
  async 루미르스토리_상태를_변경한다(
    id: string,
    status: ContentStatus,
    updatedBy?: string,
  ): Promise<LumirStory> {
    this.logger.log(`루미르스토리 상태 변경 - ID: ${id}, 상태: ${status}`);

    return await this.루미르스토리를_업데이트한다(id, { status, updatedBy });
  }

  /**
   * 루미르스토리 공개 여부를 변경한다
   */
  async 루미르스토리_공개_여부를_변경한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<LumirStory> {
    this.logger.log(`루미르스토리 공개 여부 변경 - ID: ${id}, 공개: ${isPublic}`);

    return await this.루미르스토리를_업데이트한다(id, { isPublic, updatedBy });
  }

  /**
   * 다음 순서 번호를 계산한다
   */
  async 다음_순서를_계산한다(): Promise<number> {
    const maxOrderLumirStories = await this.lumirStoryRepository.find({
      order: { order: 'DESC' },
      select: ['order'],
      take: 1,
    });

    return maxOrderLumirStories.length > 0
      ? maxOrderLumirStories[0].order + 1
      : 0;
  }

  /**
   * 공개된 루미르스토리를 조회한다
   */
  async 공개된_루미르스토리를_조회한다(): Promise<LumirStory[]> {
    this.logger.debug(`공개된 루미르스토리 조회`);

    return await this.lumirStoryRepository.find({
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
   * 루미르스토리 오더를 일괄 업데이트한다
   */
  async 루미르스토리_오더를_일괄_업데이트한다(
    items: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `루미르스토리 오더 일괄 업데이트 시작 - ${items.length}개`,
    );

    let updatedCount = 0;

    for (const item of items) {
      try {
        await this.루미르스토리를_업데이트한다(item.id, {
          order: item.order,
          updatedBy,
        });
        updatedCount++;
      } catch (error) {
        this.logger.error(
          `루미르스토리 오더 업데이트 실패 - ID: ${item.id}`,
          error,
        );
      }
    }

    this.logger.log(
      `루미르스토리 오더 일괄 업데이트 완료 - ${updatedCount}/${items.length}개 성공`,
    );

    return {
      success: updatedCount === items.length,
      updatedCount,
    };
  }
}
