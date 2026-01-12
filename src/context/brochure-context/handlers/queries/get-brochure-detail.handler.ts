import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { BrochureService } from '@domain/core/brochure/brochure.service';
import { BrochureDetailResult } from '../../interfaces/brochure-context.interface';
import { Logger } from '@nestjs/common';

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

  constructor(private readonly brochureService: BrochureService) {}

  async execute(query: GetBrochureDetailQuery): Promise<BrochureDetailResult> {
    const { id } = query;

    this.logger.debug(`브로슈어 상세 조회 - ID: ${id}`);

    const brochure = await this.brochureService.ID로_브로슈어를_조회한다(id);

    return brochure as BrochureDetailResult;
  }
}
