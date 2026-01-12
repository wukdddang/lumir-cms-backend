import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VideoGalleryService } from '@domain/sub/video-gallery/video-gallery.service';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';
import { UpdateVideoGalleryPublicDto } from '../../interfaces/video-gallery-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 비디오갤러리 공개 수정 커맨드
 */
export class UpdateVideoGalleryPublicCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateVideoGalleryPublicDto,
  ) {}
}

/**
 * 비디오갤러리 공개 수정 핸들러
 */
@CommandHandler(UpdateVideoGalleryPublicCommand)
export class UpdateVideoGalleryPublicHandler
  implements ICommandHandler<UpdateVideoGalleryPublicCommand>
{
  private readonly logger = new Logger(UpdateVideoGalleryPublicHandler.name);

  constructor(private readonly videoGalleryService: VideoGalleryService) {}

  async execute(command: UpdateVideoGalleryPublicCommand): Promise<VideoGallery> {
    const { id, data } = command;

    this.logger.log(`비디오갤러리 공개 수정 시작 - ID: ${id}`);

    const updated =
      await this.videoGalleryService.비디오갤러리_공개_여부를_변경한다(
        id,
        data.isPublic,
        data.updatedBy,
      );

    this.logger.log(`비디오갤러리 공개 수정 완료 - ID: ${id}`);

    return updated;
  }
}
