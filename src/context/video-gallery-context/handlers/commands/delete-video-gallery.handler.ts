import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VideoGalleryService } from '@domain/sub/video-gallery/video-gallery.service';
import { Logger } from '@nestjs/common';

/**
 * 비디오갤러리 삭제 커맨드
 */
export class DeleteVideoGalleryCommand {
  constructor(public readonly id: string) {}
}

/**
 * 비디오갤러리 삭제 핸들러
 */
@CommandHandler(DeleteVideoGalleryCommand)
export class DeleteVideoGalleryHandler
  implements ICommandHandler<DeleteVideoGalleryCommand>
{
  private readonly logger = new Logger(DeleteVideoGalleryHandler.name);

  constructor(private readonly videoGalleryService: VideoGalleryService) {}

  async execute(command: DeleteVideoGalleryCommand): Promise<boolean> {
    const { id } = command;

    this.logger.log(`비디오갤러리 삭제 시작 - ID: ${id}`);

    const result = await this.videoGalleryService.비디오갤러리를_삭제한다(id);

    this.logger.log(`비디오갤러리 삭제 완료 - ID: ${id}`);

    return result;
  }
}
