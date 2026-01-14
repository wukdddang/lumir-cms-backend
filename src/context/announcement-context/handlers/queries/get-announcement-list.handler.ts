import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from '@domain/core/announcement/announcement.entity';
import { AnnouncementListResult } from '../../interfaces/announcement-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 공지사항 목록 조회 쿼리
 */
export class GetAnnouncementListQuery {
  constructor(
    public readonly isPublic?: boolean,
    public readonly isFixed?: boolean,
    public readonly orderBy: 'order' | 'createdAt' = 'order',
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
  ) {}
}

/**
 * 공지사항 목록 조회 핸들러
 */
@QueryHandler(GetAnnouncementListQuery)
export class GetAnnouncementListHandler implements IQueryHandler<GetAnnouncementListQuery> {
  private readonly logger = new Logger(GetAnnouncementListHandler.name);

  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
  ) {}

  async execute(
    query: GetAnnouncementListQuery,
  ): Promise<AnnouncementListResult> {
    const { isPublic, isFixed, orderBy, page, limit, startDate, endDate } = query;

    this.logger.debug(
      `공지사항 목록 조회 - 공개: ${isPublic}, 고정: ${isFixed}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const queryBuilder =
      this.announcementRepository.createQueryBuilder('announcement');

    let hasWhere = false;

    if (isPublic !== undefined) {
      queryBuilder.where('announcement.isPublic = :isPublic', { isPublic });
      hasWhere = true;
    }

    if (isFixed !== undefined) {
      if (hasWhere) {
        queryBuilder.andWhere('announcement.isFixed = :isFixed', { isFixed });
      } else {
        queryBuilder.where('announcement.isFixed = :isFixed', { isFixed });
        hasWhere = true;
      }
    }

    if (startDate) {
      if (hasWhere) {
        queryBuilder.andWhere('announcement.createdAt >= :startDate', { startDate });
      } else {
        queryBuilder.where('announcement.createdAt >= :startDate', { startDate });
        hasWhere = true;
      }
    }

    if (endDate) {
      if (hasWhere) {
        queryBuilder.andWhere('announcement.createdAt <= :endDate', { endDate });
      } else {
        queryBuilder.where('announcement.createdAt <= :endDate', { endDate });
        hasWhere = true;
      }
    }

    // 고정 공지는 항상 최상단
    queryBuilder.orderBy('announcement.isFixed', 'DESC');

    if (orderBy === 'order') {
      queryBuilder.addOrderBy('announcement.order', 'DESC');
    } else {
      queryBuilder.addOrderBy('announcement.createdAt', 'DESC');
    }

    // 페이지네이션 적용
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, limit };
  }
}
