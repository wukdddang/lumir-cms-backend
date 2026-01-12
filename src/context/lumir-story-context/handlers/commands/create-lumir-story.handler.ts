import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LumirStoryService } from '@domain/sub/lumir-story/lumir-story.service';
import { ContentStatus } from '@domain/core/content-status.types';
import {
  CreateLumirStoryDto,
  CreateLumirStoryResult,
} from '../../interfaces/lumir-story-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 루미르스토리 생성 커맨드
 */
export class CreateLumirStoryCommand {
  constructor(public readonly data: CreateLumirStoryDto) {}
}

/**
 * 루미르스토리 생성 핸들러
 */
@CommandHandler(CreateLumirStoryCommand)
export class CreateLumirStoryHandler
  implements ICommandHandler<CreateLumirStoryCommand>
{
  private readonly logger = new Logger(CreateLumirStoryHandler.name);

  constructor(private readonly lumirStoryService: LumirStoryService) {}

  async execute(
    command: CreateLumirStoryCommand,
  ): Promise<CreateLumirStoryResult> {
    const { data } = command;

    this.logger.log(`루미르스토리 생성 시작 - 제목: ${data.title}`);

    // 자동으로 order 계산
    const nextOrder = await this.lumirStoryService.다음_순서를_계산한다();

    // 루미르스토리 생성 (기본값: 비공개, DRAFT 상태)
    const saved = await this.lumirStoryService.루미르스토리를_생성한다({
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl || null,
      isPublic: false, // 기본값: 비공개
      status: ContentStatus.DRAFT, // 기본값: DRAFT
      order: nextOrder, // 자동 계산
      attachments: data.attachments || null,
      createdBy: data.createdBy,
      updatedBy: data.createdBy, // 생성 시점이므로 createdBy와 동일
    });

    this.logger.log(
      `루미르스토리 생성 완료 - ID: ${saved.id}, Order: ${saved.order}`,
    );

    return {
      id: saved.id,
      isPublic: saved.isPublic,
      status: saved.status,
      order: saved.order,
      createdAt: saved.createdAt,
    };
  }
}
