import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NewsService } from '@domain/core/news/news.service';
import { Logger } from '@nestjs/common';

/**
 * 뉴스 오더 일괄 수정 DTO
 */
export interface UpdateNewsBatchOrderDto {
  news: Array<{ id: string; order: number }>;
  updatedBy?: string;
}

/**
 * 뉴스 오더 일괄 수정 커맨드
 */
export class UpdateNewsBatchOrderCommand {
  constructor(public readonly data: UpdateNewsBatchOrderDto) {}
}

/**
 * 뉴스 오더 일괄 수정 핸들러
 */
@CommandHandler(UpdateNewsBatchOrderCommand)
export class UpdateNewsBatchOrderHandler
  implements ICommandHandler<UpdateNewsBatchOrderCommand>
{
  private readonly logger = new Logger(UpdateNewsBatchOrderHandler.name);

  constructor(private readonly newsService: NewsService) {}

  async execute(
    command: UpdateNewsBatchOrderCommand,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const { data } = command;

    this.logger.log(
      `뉴스 오더 일괄 수정 시작 - 수정할 뉴스 수: ${data.news.length}`,
    );

    const result = await this.newsService.뉴스_오더를_일괄_업데이트한다(
      data.news,
      data.updatedBy,
    );

    this.logger.log(
      `뉴스 오더 일괄 수정 완료 - 수정된 뉴스 수: ${result.updatedCount}`,
    );

    return result;
  }
}
