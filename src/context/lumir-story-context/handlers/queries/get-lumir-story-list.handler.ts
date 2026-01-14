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
  ) {}
}

/**
 * 루미르스토리 목록 조회 핸들러
 */
@QueryHandler(GetLumirStoryListQuery)
export class GetLumirStoryListHandler
  implements IQueryHandler<GetLumirStoryListQuery>
{
  private readonly logger = new Logger(GetLumirStoryListHandler.name);

  constructor(
    @InjectRepository(LumirStory)
    private readonly lumirStoryRepository: Repository<LumirStory>,
  ) {}

  async execute(query: GetLumirStoryListQuery): Promise<LumirStoryListResult> {
    const { isPublic, orderBy, page, limit, startDate, endDate } = query;

    this.logger.debug(
      `루미르스토리 목록 조회 - 공개: ${isPublic}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const queryBuilder =
      this.lumirStoryRepository.createQueryBuilder('lumirStory');

    let hasWhere = false;

    if (isPublic !== undefined) {
      queryBuilder.where('lumirStory.isPublic = :isPublic', { isPublic });
      hasWhere = true;
    }

    if (startDate) {
      if (hasWhere) {
        queryBuilder.andWhere('lumirStory.createdAt >= :startDate', { startDate });
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

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, limit };
  }
}
