import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnnouncementService } from '@domain/core/announcement/announcement.service';
import { Logger } from '@nestjs/common';

/**
 * 공지사항 오더 일괄 수정 DTO
 */
export interface UpdateAnnouncementBatchOrderDto {
  announcements: Array<{ id: string; order: number }>;
  updatedBy?: string;
}

/**
 * 공지사항 오더 일괄 수정 커맨드
 */
export class UpdateAnnouncementBatchOrderCommand {
  constructor(public readonly data: UpdateAnnouncementBatchOrderDto) {}
}

/**
 * 공지사항 오더 일괄 수정 핸들러
 */
@CommandHandler(UpdateAnnouncementBatchOrderCommand)
export class UpdateAnnouncementBatchOrderHandler
  implements ICommandHandler<UpdateAnnouncementBatchOrderCommand>
{
  private readonly logger = new Logger(UpdateAnnouncementBatchOrderHandler.name);

  constructor(private readonly announcementService: AnnouncementService) {}

  async execute(
    command: UpdateAnnouncementBatchOrderCommand,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const { data } = command;

    this.logger.log(
      `공지사항 오더 일괄 수정 시작 - 수정할 공지사항 수: ${data.announcements.length}`,
    );

    const result = await this.announcementService.공지사항_오더를_일괄_업데이트한다(
      data.announcements,
      data.updatedBy,
    );

    this.logger.log(
      `공지사항 오더 일괄 수정 완료 - 수정된 공지사항 수: ${result.updatedCount}`,
    );

    return result;
  }
}
