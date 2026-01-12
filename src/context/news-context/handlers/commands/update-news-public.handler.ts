import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NewsService } from '@domain/core/news/news.service';
import { News } from '@domain/core/news/news.entity';
import { UpdateNewsPublicDto } from '../../interfaces/news-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 뉴스 공개 수정 커맨드
 */
export class UpdateNewsPublicCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateNewsPublicDto,
  ) {}
}

/**
 * 뉴스 공개 수정 핸들러
 */
@CommandHandler(UpdateNewsPublicCommand)
export class UpdateNewsPublicHandler
  implements ICommandHandler<UpdateNewsPublicCommand>
{
  private readonly logger = new Logger(UpdateNewsPublicHandler.name);

  constructor(private readonly newsService: NewsService) {}

  async execute(command: UpdateNewsPublicCommand): Promise<News> {
    const { id, data } = command;

    this.logger.log(`뉴스 공개 수정 시작 - ID: ${id}`);

    const updated = await this.newsService.뉴스_공개_여부를_변경한다(
      id,
      data.isPublic,
      data.updatedBy,
    );

    this.logger.log(`뉴스 공개 수정 완료 - ID: ${id}`);

    return updated;
  }
}
