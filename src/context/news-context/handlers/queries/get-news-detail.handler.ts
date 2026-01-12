import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NewsService } from '@domain/core/news/news.service';
import { NewsDetailResult } from '../../interfaces/news-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 뉴스 상세 조회 쿼리
 */
export class GetNewsDetailQuery {
  constructor(public readonly id: string) {}
}

/**
 * 뉴스 상세 조회 핸들러
 */
@QueryHandler(GetNewsDetailQuery)
export class GetNewsDetailHandler
  implements IQueryHandler<GetNewsDetailQuery>
{
  private readonly logger = new Logger(GetNewsDetailHandler.name);

  constructor(private readonly newsService: NewsService) {}

  async execute(query: GetNewsDetailQuery): Promise<NewsDetailResult> {
    const { id } = query;

    this.logger.debug(`뉴스 상세 조회 - ID: ${id}`);

    const news = await this.newsService.ID로_뉴스를_조회한다(id);

    return news;
  }
}
