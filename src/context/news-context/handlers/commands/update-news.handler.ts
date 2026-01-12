import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NewsService } from '@domain/core/news/news.service';
import { News } from '@domain/core/news/news.entity';
import { UpdateNewsDto } from '../../interfaces/news-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 뉴스 수정 커맨드
 */
export class UpdateNewsCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateNewsDto,
  ) {}
}

/**
 * 뉴스 수정 핸들러
 */
@CommandHandler(UpdateNewsCommand)
export class UpdateNewsHandler implements ICommandHandler<UpdateNewsCommand> {
  private readonly logger = new Logger(UpdateNewsHandler.name);

  constructor(private readonly newsService: NewsService) {}

  async execute(command: UpdateNewsCommand): Promise<News> {
    const { id, data } = command;

    this.logger.log(`뉴스 수정 시작 - ID: ${id}`);

    const updated = await this.newsService.뉴스를_업데이트한다(id, data);

    this.logger.log(`뉴스 수정 완료 - ID: ${id}`);

    return updated;
  }
}
