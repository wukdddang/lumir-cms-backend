import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from '@domain/core/news/news.entity';
import { NewsListResult } from '../../interfaces/news-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 뉴스 목록 조회 쿼리
 */
export class GetNewsListQuery {
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
 * 뉴스 목록 조회 핸들러
 */
@QueryHandler(GetNewsListQuery)
export class GetNewsListHandler implements IQueryHandler<GetNewsListQuery> {
  private readonly logger = new Logger(GetNewsListHandler.name);

  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
  ) {}

  async execute(query: GetNewsListQuery): Promise<NewsListResult> {
    const { isPublic, orderBy, page, limit, startDate, endDate } = query;

    this.logger.debug(
      `뉴스 목록 조회 - 공개: ${isPublic}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const queryBuilder = this.newsRepository.createQueryBuilder('news');

    // category 조인
    queryBuilder.leftJoin('categories', 'category', 'news.categoryId = category.id');
    queryBuilder.addSelect(['category.name']);

    let hasWhere = false;

    if (isPublic !== undefined) {
      queryBuilder.where('news.isPublic = :isPublic', { isPublic });
      hasWhere = true;
    }

    if (startDate) {
      if (hasWhere) {
        queryBuilder.andWhere('news.createdAt >= :startDate', { startDate });
      } else {
        queryBuilder.where('news.createdAt >= :startDate', { startDate });
        hasWhere = true;
      }
    }

    if (endDate) {
      if (hasWhere) {
        queryBuilder.andWhere('news.createdAt <= :endDate', { endDate });
      } else {
        queryBuilder.where('news.createdAt <= :endDate', { endDate });
        hasWhere = true;
      }
    }

    if (orderBy === 'order') {
      queryBuilder.orderBy('news.order', 'ASC');
    } else {
      queryBuilder.orderBy('news.createdAt', 'DESC');
    }

    // 페이지네이션 적용
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const rawAndEntities = await queryBuilder.getRawAndEntities();
    const items = rawAndEntities.entities;
    const raw = rawAndEntities.raw;
    const total = await queryBuilder.skip(0).take(undefined).getCount(); // Count separately

    // raw 데이터에서 category name을 엔티티에 매핑
    items.forEach((news, index) => {
      if (raw[index] && raw[index].category_name) {
        news.category = {
          name: raw[index].category_name,
        };
      }
    });

    return { items, total, page, limit };
  }
}
