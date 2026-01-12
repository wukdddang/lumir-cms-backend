import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VideoGalleryService } from '@domain/sub/video-gallery/video-gallery.service';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';
import { UpdateVideoGalleryDto } from '../../interfaces/video-gallery-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 비디오갤러리 수정 커맨드
 */
export class UpdateVideoGalleryCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateVideoGalleryDto,
  ) {}
}

/**
 * 비디오갤러리 수정 핸들러
 */
@CommandHandler(UpdateVideoGalleryCommand)
export class UpdateVideoGalleryHandler
  implements ICommandHandler<UpdateVideoGalleryCommand>
{
  private readonly logger = new Logger(UpdateVideoGalleryHandler.name);

  constructor(private readonly videoGalleryService: VideoGalleryService) {}

  async execute(command: UpdateVideoGalleryCommand): Promise<VideoGallery> {
    const { id, data } = command;

    this.logger.log(`비디오갤러리 수정 시작 - ID: ${id}`);

    const updated = await this.videoGalleryService.비디오갤러리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`비디오갤러리 수정 완료 - ID: ${id}`);

    return updated;
  }
}
