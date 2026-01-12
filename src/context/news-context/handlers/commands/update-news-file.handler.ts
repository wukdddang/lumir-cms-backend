import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from '@domain/core/news/news.entity';
import { UpdateNewsFileDto } from '../../interfaces/news-context.interface';
import { Logger, NotFoundException } from '@nestjs/common';

/**
 * 뉴스 파일 수정 커맨드
 */
export class UpdateNewsFileCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateNewsFileDto,
  ) {}
}

/**
 * 뉴스 파일 수정 핸들러
 */
@CommandHandler(UpdateNewsFileCommand)
export class UpdateNewsFileHandler
  implements ICommandHandler<UpdateNewsFileCommand>
{
  private readonly logger = new Logger(UpdateNewsFileHandler.name);

  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
  ) {}

  async execute(command: UpdateNewsFileCommand): Promise<News> {
    const { id, data } = command;

    this.logger.log(`뉴스 파일 수정 시작 - ID: ${id}`);

    // 뉴스 조회
    const news = await this.newsRepository.findOne({ where: { id } });

    if (!news) {
      throw new NotFoundException(`뉴스를 찾을 수 없습니다. ID: ${id}`);
    }

    // 파일 업데이트
    news.attachments = data.attachments;
    if (data.updatedBy) {
      news.updatedBy = data.updatedBy;
    }

    const updated = await this.newsRepository.save(news);

    this.logger.log(`뉴스 파일 수정 완료 - ID: ${id}`);

    return updated;
  }
}
