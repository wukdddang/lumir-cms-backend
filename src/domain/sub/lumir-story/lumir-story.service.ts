import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LumirStory } from './lumir-story.entity';

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
  async 루미르스토리를_생성한다(
    data: Partial<LumirStory>,
  ): Promise<LumirStory> {
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
    isPublic?: boolean;
    orderBy?: 'order' | 'createdAt';
  }): Promise<LumirStory[]> {
    this.logger.debug(`루미르스토리 목록 조회`);

    const queryBuilder =
      this.lumirStoryRepository.createQueryBuilder('lumirStory');

    // category 조인
    queryBuilder.leftJoin('categories', 'category', 'lumirStory.categoryId = category.id');
    queryBuilder.addSelect(['category.name']);

    if (options?.isPublic !== undefined) {
      queryBuilder.where('lumirStory.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
    }

    const orderBy = options?.orderBy || 'order';
    if (orderBy === 'order') {
      queryBuilder.orderBy('lumirStory.order', 'ASC');
    } else {
      queryBuilder.orderBy('lumirStory.createdAt', 'DESC');
    }

    const rawAndEntities = await queryBuilder.getRawAndEntities();
    const items = rawAndEntities.entities;
    const raw = rawAndEntities.raw;

    // raw 데이터에서 category name을 엔티티에 매핑
    // LumirStory는 translations가 없지만, 일관성을 위해 id로 매핑
    items.forEach((lumirStory) => {
      const matchingRaw = raw.find((r) => r.lumirStory_id === lumirStory.id);
      if (matchingRaw && matchingRaw.category_name) {
        lumirStory.category = {
          name: matchingRaw.category_name,
        };
      }
    });

    return items;
  }

  /**
   * ID로 루미르스토리를 조회한다
   */
  async ID로_루미르스토리를_조회한다(id: string): Promise<LumirStory> {
    this.logger.debug(`루미르스토리 조회 - ID: ${id}`);

    const queryBuilder = this.lumirStoryRepository
      .createQueryBuilder('lumirStory')
      .leftJoin('categories', 'category', 'lumirStory.categoryId = category.id')
      .addSelect(['category.name'])
      .where('lumirStory.id = :id', { id });

    const rawAndEntities = await queryBuilder.getRawAndEntities();

    if (!rawAndEntities.entities || rawAndEntities.entities.length === 0) {
      throw new NotFoundException(`루미르스토리를 찾을 수 없습니다. ID: ${id}`);
    }

    const lumirStory = rawAndEntities.entities[0];
    const raw = rawAndEntities.raw[0];

    // raw 데이터에서 category name을 엔티티에 매핑
    if (raw && raw.category_name) {
      lumirStory.category = {
        name: raw.category_name,
      };
      this.logger.debug(`루미르스토리 ${lumirStory.id}: 카테고리명 = ${raw.category_name}`);
    } else {
      this.logger.warn(`루미르스토리 ${lumirStory.id}: 카테고리명을 찾을 수 없음. categoryId: ${lumirStory.categoryId}`);
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
   * 루미르스토리 공개 여부를 변경한다
   */
  async 루미르스토리_공개_여부를_변경한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<LumirStory> {
    this.logger.log(
      `루미르스토리 공개 여부 변경 - ID: ${id}, 공개: ${isPublic}`,
    );

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
      `루미르스토리 일괄 순서 수정 시작 - 수정할 루미르스토리 수: ${items.length}`,
    );

    if (items.length === 0) {
      throw new BadRequestException('수정할 루미르스토리가 없습니다.');
    }

    // 루미르스토리 ID 목록 추출 (중복 제거)
    const uniqueStoryIds = [...new Set(items.map((item) => item.id))];

    // 루미르스토리 조회
    const existingStories = await this.lumirStoryRepository.find({
      where: { id: In(uniqueStoryIds) },
    });

    // 존재하지 않는 ID 확인 (unique ID 개수와 비교)
    if (existingStories.length !== uniqueStoryIds.length) {
      const foundIds = existingStories.map((s) => s.id);
      const missingIds = uniqueStoryIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `일부 루미르스토리를 찾을 수 없습니다. 누락된 ID: ${missingIds.join(', ')}`,
      );
    }

    // 순서 업데이트를 위한 맵 생성
    const orderMap = new Map<string, number>();
    items.forEach((item) => {
      orderMap.set(item.id, item.order);
    });

    // 각 루미르스토리의 순서 업데이트
    const updatePromises = existingStories.map((story) => {
      const newOrder = orderMap.get(story.id);
      if (newOrder !== undefined) {
        story.order = newOrder;
        if (updatedBy) {
          story.updatedBy = updatedBy;
        }
      }
      return this.lumirStoryRepository.save(story);
    });

    await Promise.all(updatePromises);

    this.logger.log(
      `루미르스토리 일괄 순서 수정 완료 - 수정된 루미르스토리 수: ${existingStories.length}`,
    );

    return {
      success: true,
      updatedCount: existingStories.length,
    };
  }
}
