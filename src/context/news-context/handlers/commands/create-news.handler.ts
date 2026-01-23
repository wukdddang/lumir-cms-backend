import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NewsService } from '@domain/core/news/news.service';
import {
  CreateNewsDto,
  CreateNewsResult,
} from '../../interfaces/news-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 뉴스 생성 커맨드
 */
export class CreateNewsCommand {
  constructor(public readonly data: CreateNewsDto) {}
}

/**
 * 뉴스 생성 핸들러
 */
@CommandHandler(CreateNewsCommand)
export class CreateNewsHandler implements ICommandHandler<CreateNewsCommand> {
  private readonly logger = new Logger(CreateNewsHandler.name);

  constructor(private readonly newsService: NewsService) {}

  async execute(command: CreateNewsCommand): Promise<CreateNewsResult> {
    const { data } = command;

    this.logger.log(`뉴스 생성 시작 - 제목: ${data.title}`);

    // 자동으로 order 계산
    const nextOrder = await this.newsService.다음_순서를_계산한다();

    // 뉴스 생성 (기본값: 공개)
    const saved = await this.newsService.뉴스를_생성한다({
      title: data.title,
      description: data.description || null,
      url: data.url || null,
      categoryId: data.categoryId,
      isPublic: true, // 기본값: 공개
      order: nextOrder, // 자동 계산
      attachments: data.attachments || null,
      createdBy: data.createdBy,
      updatedBy: data.createdBy, // 생성 시점이므로 createdBy와 동일
    });

    this.logger.log(`뉴스 생성 완료 - ID: ${saved.id}, Order: ${saved.order}`);

    return {
      id: saved.id,
      isPublic: saved.isPublic,
      order: saved.order,
      createdAt: saved.createdAt,
    };
  }
}
