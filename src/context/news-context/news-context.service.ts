import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateNewsCommand } from './handlers/commands/create-news.handler';
import { UpdateNewsCommand } from './handlers/commands/update-news.handler';
import { DeleteNewsCommand } from './handlers/commands/delete-news.handler';
import { UpdateNewsPublicCommand } from './handlers/commands/update-news-public.handler';
import {
  UpdateNewsBatchOrderCommand,
  UpdateNewsBatchOrderDto,
} from './handlers/commands/update-news-batch-order.handler';
import { UpdateNewsFileCommand } from './handlers/commands/update-news-file.handler';
import { GetNewsListQuery } from './handlers/queries/get-news-list.handler';
import { GetNewsDetailQuery } from './handlers/queries/get-news-detail.handler';
import {
  CreateNewsDto,
  CreateNewsResult,
  UpdateNewsDto,
  UpdateNewsPublicDto,
  UpdateNewsFileDto,
  NewsListResult,
  NewsDetailResult,
} from './interfaces/news-context.interface';
import { News } from '@domain/core/news/news.entity';

/**
 * 뉴스 컨텍스트 서비스
 *
 * 뉴스 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class NewsContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 뉴스를 생성한다
   */
  async 뉴스를_생성한다(data: CreateNewsDto): Promise<CreateNewsResult> {
    const command = new CreateNewsCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 뉴스를 수정한다
   */
  async 뉴스를_수정한다(id: string, data: UpdateNewsDto): Promise<News> {
    const command = new UpdateNewsCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 뉴스를 삭제한다
   */
  async 뉴스를_삭제한다(id: string): Promise<boolean> {
    const command = new DeleteNewsCommand(id);
    return await this.commandBus.execute(command);
  }

  /**
   * 뉴스 공개를 수정한다
   */
  async 뉴스_공개를_수정한다(
    id: string,
    data: UpdateNewsPublicDto,
  ): Promise<News> {
    const command = new UpdateNewsPublicCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 뉴스 오더를 일괄 수정한다
   */
  async 뉴스_오더를_일괄_수정한다(
    data: UpdateNewsBatchOrderDto,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const command = new UpdateNewsBatchOrderCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 뉴스 파일을 수정한다
   */
  async 뉴스_파일을_수정한다(
    id: string,
    data: UpdateNewsFileDto,
  ): Promise<News> {
    const command = new UpdateNewsFileCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 뉴스 목록을 조회한다
   */
  async 뉴스_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
  ): Promise<NewsListResult> {
    const query = new GetNewsListQuery(isPublic, orderBy, page, limit);
    return await this.queryBus.execute(query);
  }

  /**
   * 뉴스 상세 조회한다
   */
  async 뉴스_상세_조회한다(id: string): Promise<NewsDetailResult> {
    const query = new GetNewsDetailQuery(id);
    return await this.queryBus.execute(query);
  }
}
