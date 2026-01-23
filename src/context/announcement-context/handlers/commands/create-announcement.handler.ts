import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnnouncementService } from '@domain/core/announcement/announcement.service';
import {
  CreateAnnouncementDto,
  CreateAnnouncementResult,
} from '../../interfaces/announcement-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 공지사항 생성 커맨드
 */
export class CreateAnnouncementCommand {
  constructor(public readonly data: CreateAnnouncementDto) {}
}

/**
 * 공지사항 생성 핸들러
 */
@CommandHandler(CreateAnnouncementCommand)
export class CreateAnnouncementHandler
  implements ICommandHandler<CreateAnnouncementCommand>
{
  private readonly logger = new Logger(CreateAnnouncementHandler.name);

  constructor(private readonly announcementService: AnnouncementService) {}

  async execute(
    command: CreateAnnouncementCommand,
  ): Promise<CreateAnnouncementResult> {
    const { data } = command;

    this.logger.log(`공지사항 생성 시작 - 제목: ${data.title}`);

    // 공지사항 생성 (기본값: 전사공개, 일반 공지)
    const saved = await this.announcementService.공지사항을_생성한다({
      categoryId: data.categoryId,
      title: data.title,
      content: data.content,
      isFixed: data.isFixed ?? false, // 기본값: 일반 공지
      isPublic: data.isPublic ?? true, // 기본값: 전사공개
      releasedAt: data.releasedAt ?? null,
      expiredAt: data.expiredAt ?? null,
      mustRead: data.mustRead ?? false, // 기본값: 필독 아님
      permissionEmployeeIds: data.permissionEmployeeIds ?? null,
      permissionRankIds: data.permissionRankIds ?? null,
      permissionPositionIds: data.permissionPositionIds ?? null,
      permissionDepartmentIds: data.permissionDepartmentIds ?? null,
      attachments: data.attachments ?? null,
      order: 0, // 기본값
      createdBy: data.createdBy,
      updatedBy: data.createdBy, // 생성 시점이므로 createdBy와 동일
    });

    this.logger.log(
      `공지사항 생성 완료 - ID: ${saved.id}, Order: ${saved.order}`,
    );

    return {
      id: saved.id,
      isPublic: saved.isPublic,
      isFixed: saved.isFixed,
      order: saved.order,
      createdAt: saved.createdAt,
    };
  }
}
