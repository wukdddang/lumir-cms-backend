import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';
import {
  VideoSourceDto as BaseVideoSourceDto,
  CreateVideoGalleryDto as BaseCreateVideoGalleryDto,
} from '@interface/common/dto/video-gallery/create-video-gallery.dto';
import {
  UpdateVideoGalleryDto as BaseUpdateVideoGalleryDto,
  UpdateVideoGalleryFileDto as BaseUpdateVideoGalleryFileDto,
  UpdateVideoGalleryPublicDto as BaseUpdateVideoGalleryPublicDto,
  UpdateVideoGalleryOrderDto as BaseUpdateVideoGalleryOrderDto,
} from '@interface/common/dto/video-gallery/update-video-gallery.dto';

// Re-export base types
export { VideoSourceDto } from '@interface/common/dto/video-gallery/create-video-gallery.dto';

/**
 * 비디오갤러리 생성 DTO (Context Layer용 - createdBy 포함)
 */
export interface CreateVideoGalleryDto extends BaseCreateVideoGalleryDto {
  createdBy?: string;
}

/**
 * 비디오갤러리 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateVideoGalleryDto extends BaseUpdateVideoGalleryDto {
  updatedBy?: string;
}

/**
 * 비디오갤러리 공개 상태 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateVideoGalleryPublicDto extends BaseUpdateVideoGalleryPublicDto {
  updatedBy?: string;
}

/**
 * 비디오갤러리 오더 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateVideoGalleryOrderDto extends BaseUpdateVideoGalleryOrderDto {
  updatedBy?: string;
}

/**
 * 비디오갤러리 파일 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateVideoGalleryFileDto extends BaseUpdateVideoGalleryFileDto {
  updatedBy?: string;
}

/**
 * 비디오갤러리 생성 결과
 */
export interface CreateVideoGalleryResult {
  id: string;
  isPublic: boolean;
  order: number;
  createdAt: Date;
}

/**
 * 비디오갤러리 목록 조회 결과
 */
export interface VideoGalleryListResult {
  items: VideoGallery[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 비디오갤러리 상세 조회 결과
 */
export interface VideoGalleryDetailResult extends VideoGallery {}
