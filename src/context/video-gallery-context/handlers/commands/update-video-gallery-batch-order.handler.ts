import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VideoGalleryService } from '@domain/sub/video-gallery/video-gallery.service';
import { Logger } from '@nestjs/common';

/**
 * 비디오갤러리 오더 일괄 수정 DTO
 */
export interface UpdateVideoGalleryBatchOrderDto {
  videoGalleries: Array<{ id: string; order: number }>;
  updatedBy?: string;
}

/**
 * 비디오갤러리 오더 일괄 수정 커맨드
 */
export class UpdateVideoGalleryBatchOrderCommand {
  constructor(public readonly data: UpdateVideoGalleryBatchOrderDto) {}
}

/**
 * 비디오갤러리 오더 일괄 수정 핸들러
 */
@CommandHandler(UpdateVideoGalleryBatchOrderCommand)
export class UpdateVideoGalleryBatchOrderHandler
  implements ICommandHandler<UpdateVideoGalleryBatchOrderCommand>
{
  private readonly logger = new Logger(
    UpdateVideoGalleryBatchOrderHandler.name,
  );

  constructor(private readonly videoGalleryService: VideoGalleryService) {}

  async execute(
    command: UpdateVideoGalleryBatchOrderCommand,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const { data } = command;

    this.logger.log(
      `비디오갤러리 오더 일괄 수정 시작 - 수정할 비디오갤러리 수: ${data.videoGalleries.length}`,
    );

    const result =
      await this.videoGalleryService.비디오갤러리_오더를_일괄_업데이트한다(
        data.videoGalleries,
        data.updatedBy,
      );

    this.logger.log(
      `비디오갤러리 오더 일괄 수정 완료 - 수정된 비디오갤러리 수: ${result.updatedCount}`,
    );

    return result;
  }
}
