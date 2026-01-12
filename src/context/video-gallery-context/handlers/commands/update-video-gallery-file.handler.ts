import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';
import { UpdateVideoGalleryFileDto } from '../../interfaces/video-gallery-context.interface';
import { Logger, NotFoundException } from '@nestjs/common';

/**
 * 비디오갤러리 파일 수정 커맨드
 */
export class UpdateVideoGalleryFileCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateVideoGalleryFileDto,
  ) {}
}

/**
 * 비디오갤러리 파일 수정 핸들러
 */
@CommandHandler(UpdateVideoGalleryFileCommand)
export class UpdateVideoGalleryFileHandler
  implements ICommandHandler<UpdateVideoGalleryFileCommand>
{
  private readonly logger = new Logger(UpdateVideoGalleryFileHandler.name);

  constructor(
    @InjectRepository(VideoGallery)
    private readonly videoGalleryRepository: Repository<VideoGallery>,
  ) {}

  async execute(command: UpdateVideoGalleryFileCommand): Promise<VideoGallery> {
    const { id, data } = command;

    this.logger.log(`비디오갤러리 파일 수정 시작 - ID: ${id}`);

    // 비디오갤러리 조회
    const videoGallery = await this.videoGalleryRepository.findOne({
      where: { id },
    });

    if (!videoGallery) {
      throw new NotFoundException(`비디오갤러리를 찾을 수 없습니다. ID: ${id}`);
    }

    // 파일 업데이트
    videoGallery.attachments = data.attachments;
    if (data.updatedBy) {
      videoGallery.updatedBy = data.updatedBy;
    }

    const updated = await this.videoGalleryRepository.save(videoGallery);

    this.logger.log(`비디오갤러리 파일 수정 완료 - ID: ${id}`);

    return updated;
  }
}
