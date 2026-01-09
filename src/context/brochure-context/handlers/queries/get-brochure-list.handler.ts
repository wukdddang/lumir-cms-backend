import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureListResult } from '../../interfaces/brochure-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 브로슈어 목록 조회 쿼리
 */
export class GetBrochureListQuery {
  constructor(
    public readonly isPublic?: boolean,
    public readonly orderBy: 'order' | 'createdAt' = 'order',
  ) {}
}

/**
 * 브로슈어 목록 조회 핸들러
 */
@QueryHandler(GetBrochureListQuery)
export class GetBrochureListHandler implements IQueryHandler<GetBrochureListQuery> {
  private readonly logger = new Logger(GetBrochureListHandler.name);

  constructor(
    @InjectRepository(Brochure)
    private readonly brochureRepository: Repository<Brochure>,
  ) {}

  async execute(query: GetBrochureListQuery): Promise<BrochureListResult> {
    const { isPublic, orderBy } = query;

    this.logger.debug(`브로슈어 목록 조회 - 공개: ${isPublic}, 정렬: ${orderBy}`);

    const queryBuilder = this.brochureRepository
      .createQueryBuilder('brochure')
      .leftJoinAndSelect('brochure.translations', 'translations')
      .leftJoinAndSelect('translations.language', 'language');

    if (isPublic !== undefined) {
      queryBuilder.where('brochure.isPublic = :isPublic', { isPublic });
    }

    if (orderBy === 'order') {
      queryBuilder.orderBy('brochure.order', 'ASC');
    } else {
      queryBuilder.orderBy('brochure.createdAt', 'DESC');
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total };
  }
}
