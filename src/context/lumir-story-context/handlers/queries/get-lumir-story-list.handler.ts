import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';
import { LumirStoryListResult } from '../../interfaces/lumir-story-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 루미르스토리 목록 조회 쿼리
 */
export class GetLumirStoryListQuery {
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
 * 루미르스토리 목록 조회 핸들러
 */
@QueryHandler(GetLumirStoryListQuery)
export class GetLumirStoryListHandler implements IQueryHandler<GetLumirStoryListQuery> {
  private readonly logger = new Logger(GetLumirStoryListHandler.name);

  constructor(
    @InjectRepository(LumirStory)
    private readonly lumirStoryRepository: Repository<LumirStory>,
  ) {}

  async execute(query: GetLumirStoryListQuery): Promise<LumirStoryListResult> {
    const { isPublic, orderBy, page, limit, startDate, endDate, categoryId } =
      query;

    this.logger.debug(
      `루미르스토리 목록 조회 - 공개: ${isPublic}, 카테고리: ${categoryId}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const queryBuilder =
      this.lumirStoryRepository.createQueryBuilder('lumirStory');

    // category 조인
    queryBuilder.leftJoin(
      'categories',
      'category',
      'lumirStory.categoryId = category.id',
    );
    queryBuilder.addSelect(['category.name']);

    let hasWhere = false;

    if (isPublic !== undefined) {
      queryBuilder.where('lumirStory.isPublic = :isPublic', { isPublic });
      hasWhere = true;
    }

    if (categoryId) {
      if (hasWhere) {
        queryBuilder.andWhere('lumirStory.categoryId = :categoryId', {
          categoryId,
        });
      } else {
        queryBuilder.where('lumirStory.categoryId = :categoryId', {
          categoryId,
        });
        hasWhere = true;
      }
    }

    if (startDate) {
      if (hasWhere) {
        queryBuilder.andWhere('lumirStory.createdAt >= :startDate', {
          startDate,
        });
      } else {
        queryBuilder.where('lumirStory.createdAt >= :startDate', { startDate });
        hasWhere = true;
      }
    }

    if (endDate) {
      if (hasWhere) {
        queryBuilder.andWhere('lumirStory.createdAt <= :endDate', { endDate });
      } else {
        queryBuilder.where('lumirStory.createdAt <= :endDate', { endDate });
        hasWhere = true;
      }
    }

    if (orderBy === 'order') {
      queryBuilder.orderBy('lumirStory.order', 'ASC');
    } else {
      queryBuilder.orderBy('lumirStory.createdAt', 'DESC');
    }

    // 페이지네이션 적용
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const rawAndEntities = await queryBuilder.getRawAndEntities();
    const items = rawAndEntities.entities;
    const raw = rawAndEntities.raw;
    const total = await queryBuilder.skip(0).take(undefined).getCount();

    // raw 데이터에서 category name을 엔티티에 매핑
    items.forEach((lumirStory, index) => {
      if (raw[index] && raw[index].category_name) {
        lumirStory.category = {
          name: raw[index].category_name,
        };
      }
    });

    return { items, total, page, limit };
  }
}
