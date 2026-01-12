import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NewsService } from '@domain/core/news/news.service';
import { Logger } from '@nestjs/common';

/**
 * 뉴스 삭제 커맨드
 */
export class DeleteNewsCommand {
  constructor(public readonly id: string) {}
}

/**
 * 뉴스 삭제 핸들러
 */
@CommandHandler(DeleteNewsCommand)
export class DeleteNewsHandler implements ICommandHandler<DeleteNewsCommand> {
  private readonly logger = new Logger(DeleteNewsHandler.name);

  constructor(private readonly newsService: NewsService) {}

  async execute(command: DeleteNewsCommand): Promise<boolean> {
    const { id } = command;

    this.logger.log(`뉴스 삭제 시작 - ID: ${id}`);

    const result = await this.newsService.뉴스를_삭제한다(id);

    this.logger.log(`뉴스 삭제 완료 - ID: ${id}`);

    return result;
  }
}
