import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { LumirStoryService } from '@domain/sub/lumir-story/lumir-story.service';
import { LumirStoryDetailResult } from '../../interfaces/lumir-story-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 루미르스토리 상세 조회 쿼리
 */
export class GetLumirStoryDetailQuery {
  constructor(public readonly id: string) {}
}

/**
 * 루미르스토리 상세 조회 핸들러
 */
@QueryHandler(GetLumirStoryDetailQuery)
export class GetLumirStoryDetailHandler
  implements IQueryHandler<GetLumirStoryDetailQuery>
{
  private readonly logger = new Logger(GetLumirStoryDetailHandler.name);

  constructor(private readonly lumirStoryService: LumirStoryService) {}

  async execute(
    query: GetLumirStoryDetailQuery,
  ): Promise<LumirStoryDetailResult> {
    const { id } = query;

    this.logger.debug(`루미르스토리 상세 조회 - ID: ${id}`);

    const lumirStory = await this.lumirStoryService.ID로_루미르스토리를_조회한다(
      id,
    );

    return lumirStory;
  }
}
