import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VideoGalleryService } from '@domain/sub/video-gallery/video-gallery.service';
import { ContentStatus } from '@domain/core/content-status.types';
import {
  CreateVideoGalleryDto,
  CreateVideoGalleryResult,
} from '../../interfaces/video-gallery-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 비디오갤러리 생성 커맨드
 */
export class CreateVideoGalleryCommand {
  constructor(public readonly data: CreateVideoGalleryDto) {}
}

/**
 * 비디오갤러리 생성 핸들러
 */
@CommandHandler(CreateVideoGalleryCommand)
export class CreateVideoGalleryHandler
  implements ICommandHandler<CreateVideoGalleryCommand>
{
  private readonly logger = new Logger(CreateVideoGalleryHandler.name);

  constructor(private readonly videoGalleryService: VideoGalleryService) {}

  async execute(
    command: CreateVideoGalleryCommand,
  ): Promise<CreateVideoGalleryResult> {
    const { data } = command;

    this.logger.log(`비디오갤러리 생성 시작 - 제목: ${data.title}`);

    // 자동으로 order 계산
    const nextOrder = await this.videoGalleryService.다음_순서를_계산한다();

    // 비디오갤러리 생성 (기본값: 비공개, DRAFT 상태)
    const saved = await this.videoGalleryService.비디오갤러리를_생성한다({
      title: data.title,
      description: data.description || null,
      isPublic: false, // 기본값: 비공개
      status: ContentStatus.DRAFT, // 기본값: DRAFT
      order: nextOrder, // 자동 계산
      videoSources: data.videoSources || null,
      createdBy: data.createdBy,
      updatedBy: data.createdBy, // 생성 시점이므로 createdBy와 동일
    });

    this.logger.log(
      `비디오갤러리 생성 완료 - ID: ${saved.id}, Order: ${saved.order}`,
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
