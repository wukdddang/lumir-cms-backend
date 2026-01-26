import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
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
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
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
    private readonly configService: ConfigService,
  ) {}

  async execute(query: GetBrochureListQuery): Promise<BrochureListResult> {
    const { isPublic, orderBy, page, limit, startDate, endDate } = query;

    this.logger.debug(
      `브로슈어 목록 조회 - 공개: ${isPublic}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const defaultLanguageCode = this.configService.get<string>('DEFAULT_LANGUAGE_CODE', 'en');

    const queryBuilder = this.brochureRepository
      .createQueryBuilder('brochure')
      .leftJoinAndSelect('brochure.translations', 'translations')
      .leftJoinAndSelect('translations.language', 'language')
      .leftJoin('categories', 'category', 'brochure.categoryId = category.id')
      .addSelect(['category.name'])
      // 기본 언어 번역이 있는 브로슈어만 조회 (EXISTS 서브쿼리 사용)
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from('brochure_translations', 'bt')
          .innerJoin('languages', 'lang', 'bt.languageId = lang.id')
          .where('bt.brochureId = brochure.id')
          .andWhere('lang.code = :defaultLanguageCode', { defaultLanguageCode })
          .getQuery();
        return `EXISTS ${subQuery}`;
      });

    if (isPublic !== undefined) {
      queryBuilder.andWhere('brochure.isPublic = :isPublic', { isPublic });
    }

    if (startDate) {
      queryBuilder.andWhere('brochure.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('brochure.createdAt <= :endDate', { endDate });
    }

    if (orderBy === 'order') {
      queryBuilder.orderBy('brochure.order', 'ASC');
    } else {
      queryBuilder.orderBy('brochure.createdAt', 'DESC');
    }

    // 페이지네이션 적용
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    // 목록 조회에서는 기본 언어 번역만 반환
    items.forEach((brochure) => {
      brochure.translations = brochure.translations.filter(
        (translation) => translation.language.code === defaultLanguageCode,
      );
    });

    return { items, total, page, limit };
  }
}
