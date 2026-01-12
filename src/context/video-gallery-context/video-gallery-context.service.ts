import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateVideoGalleryCommand } from './handlers/commands/create-video-gallery.handler';
import { UpdateVideoGalleryCommand } from './handlers/commands/update-video-gallery.handler';
import { DeleteVideoGalleryCommand } from './handlers/commands/delete-video-gallery.handler';
import { UpdateVideoGalleryPublicCommand } from './handlers/commands/update-video-gallery-public.handler';
import {
  UpdateVideoGalleryBatchOrderCommand,
  UpdateVideoGalleryBatchOrderDto,
} from './handlers/commands/update-video-gallery-batch-order.handler';
import { UpdateVideoGalleryFileCommand } from './handlers/commands/update-video-gallery-file.handler';
import { GetVideoGalleryListQuery } from './handlers/queries/get-video-gallery-list.handler';
import { GetVideoGalleryDetailQuery } from './handlers/queries/get-video-gallery-detail.handler';
import {
  CreateVideoGalleryDto,
  CreateVideoGalleryResult,
  UpdateVideoGalleryDto,
  UpdateVideoGalleryPublicDto,
  UpdateVideoGalleryFileDto,
  VideoGalleryListResult,
  VideoGalleryDetailResult,
} from './interfaces/video-gallery-context.interface';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';

/**
 * 비디오갤러리 컨텍스트 서비스
 *
 * 비디오갤러리 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class VideoGalleryContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 비디오갤러리를 생성한다
   */
  async 비디오갤러리를_생성한다(
    data: CreateVideoGalleryDto,
  ): Promise<CreateVideoGalleryResult> {
    const command = new CreateVideoGalleryCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 비디오갤러리를 수정한다
   */
  async 비디오갤러리를_수정한다(
    id: string,
    data: UpdateVideoGalleryDto,
  ): Promise<VideoGallery> {
    const command = new UpdateVideoGalleryCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 비디오갤러리를 삭제한다
   */
  async 비디오갤러리를_삭제한다(id: string): Promise<boolean> {
    const command = new DeleteVideoGalleryCommand(id);
    return await this.commandBus.execute(command);
  }

  /**
   * 비디오갤러리 공개를 수정한다
   */
  async 비디오갤러리_공개를_수정한다(
    id: string,
    data: UpdateVideoGalleryPublicDto,
  ): Promise<VideoGallery> {
    const command = new UpdateVideoGalleryPublicCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 비디오갤러리 오더를 일괄 수정한다
   */
  async 비디오갤러리_오더를_일괄_수정한다(
    data: UpdateVideoGalleryBatchOrderDto,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const command = new UpdateVideoGalleryBatchOrderCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 비디오갤러리 파일을 수정한다
   */
  async 비디오갤러리_파일을_수정한다(
    id: string,
    data: UpdateVideoGalleryFileDto,
  ): Promise<VideoGallery> {
    const command = new UpdateVideoGalleryFileCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 비디오갤러리 목록을 조회한다
   */
  async 비디오갤러리_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
  ): Promise<VideoGalleryListResult> {
    const query = new GetVideoGalleryListQuery(isPublic, orderBy, page, limit);
    return await this.queryBus.execute(query);
  }

  /**
   * 비디오갤러리 상세 조회한다
   */
  async 비디오갤러리_상세_조회한다(
    id: string,
  ): Promise<VideoGalleryDetailResult> {
    const query = new GetVideoGalleryDetailQuery(id);
    return await this.queryBus.execute(query);
  }
}
