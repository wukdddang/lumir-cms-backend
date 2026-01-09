import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureDetailResult } from '../../interfaces/brochure-context.interface';
import { Logger, NotFoundException } from '@nestjs/common';

/**
 * 브로슈어 상세 조회 쿼리
 */
export class GetBrochureDetailQuery {
  constructor(public readonly id: string) {}
}

/**
 * 브로슈어 상세 조회 핸들러
 */
@QueryHandler(GetBrochureDetailQuery)
export class GetBrochureDetailHandler implements IQueryHandler<GetBrochureDetailQuery> {
  private readonly logger = new Logger(GetBrochureDetailHandler.name);

  constructor(
    @InjectRepository(Brochure)
    private readonly brochureRepository: Repository<Brochure>,
  ) {}

  async execute(query: GetBrochureDetailQuery): Promise<BrochureDetailResult> {
    const { id } = query;

    this.logger.debug(`브로슈어 상세 조회 - ID: ${id}`);

    const brochure = await this.brochureRepository.findOne({
      where: { id },
      relations: ['translations', 'translations.language'],
    });

    if (!brochure) {
      throw new NotFoundException(`브로슈어를 찾을 수 없습니다. ID: ${id}`);
    }

    return brochure as BrochureDetailResult;
  }
}
