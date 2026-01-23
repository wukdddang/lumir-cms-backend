import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';

/**
 * 비디오 소스 DTO
 */
export interface VideoSourceDto {
  url: string;
  type: 'upload' | 'youtube';
  title?: string;
  thumbnailUrl?: string;
}

/**
 * 비디오갤러리 생성 DTO
 */
export interface CreateVideoGalleryDto {
  title: string;
  description?: string | null;
  categoryId: string;
  videoSources?: VideoSourceDto[];
  createdBy?: string;
}

/**
 * 비디오갤러리 수정 DTO
 */
export interface UpdateVideoGalleryDto {
  title?: string;
  description?: string | null;
  categoryId?: string;
  isPublic?: boolean;
  order?: number;
  videoSources?: VideoSourceDto[];
  updatedBy?: string;
}

/**
 * 비디오갤러리 공개 상태 수정 DTO
 */
export interface UpdateVideoGalleryPublicDto {
  isPublic: boolean;
  updatedBy?: string;
}

/**
 * 비디오갤러리 오더 수정 DTO
 */
export interface UpdateVideoGalleryOrderDto {
  order: number;
  updatedBy?: string;
}

/**
 * 비디오갤러리 파일 수정 DTO
 */
export interface UpdateVideoGalleryFileDto {
  videoSources: VideoSourceDto[];
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
