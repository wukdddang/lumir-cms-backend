import { ApiProperty } from '@nestjs/swagger';
import { ContentStatus } from '@domain/core/content-status.types';

/**
 * 비디오갤러리 첨부파일 DTO
 */
export class VideoGalleryAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'video_sample.mp4' })
  fileName: string;

  @ApiProperty({
    description: '파일 URL',
    example: 'https://s3.amazonaws.com/...',
  })
  fileUrl: string;

  @ApiProperty({ description: '파일 크기 (bytes)', example: 10240000 })
  fileSize: number;

  @ApiProperty({ description: 'MIME 타입', example: 'video/mp4' })
  mimeType: string;
}

/**
 * 비디오갤러리 응답 DTO
 */
export class VideoGalleryResponseDto {
  @ApiProperty({ description: '비디오갤러리 ID' })
  id: string;

  @ApiProperty({ description: '제목', example: '회사 소개 영상' })
  title: string;

  @ApiProperty({
    description: '설명',
    required: false,
    nullable: true,
    example: '루미르 회사 소개 동영상입니다.',
  })
  description: string | null;

  @ApiProperty({
    description: 'YouTube 비디오 URL',
    required: false,
    nullable: true,
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  youtubeUrl: string | null;

  @ApiProperty({ description: '공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({
    description: '상태',
    enum: ContentStatus,
    example: ContentStatus.OPENED,
  })
  status: ContentStatus;

  @ApiProperty({
    description: '첨부파일 목록',
    type: [VideoGalleryAttachmentDto],
    required: false,
    nullable: true,
  })
  attachments: VideoGalleryAttachmentDto[] | null;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  order: number;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;

  @ApiProperty({ description: '생성자 ID', required: false, nullable: true })
  createdBy: string | null;

  @ApiProperty({ description: '수정자 ID', required: false, nullable: true })
  updatedBy: string | null;
}

/**
 * 비디오갤러리 목록 아이템 DTO
 */
export class VideoGalleryListItemDto {
  @ApiProperty({ description: '비디오갤러리 ID' })
  id: string;

  @ApiProperty({ description: '제목', example: '회사 소개 영상' })
  title: string;

  @ApiProperty({
    description: '설명',
    required: false,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ description: '공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({
    description: '상태',
    enum: ContentStatus,
    example: ContentStatus.OPENED,
  })
  status: ContentStatus;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  order: number;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}

/**
 * 비디오갤러리 목록 응답 DTO
 */
export class VideoGalleryListResponseDto {
  @ApiProperty({ description: '비디오갤러리 목록', type: [VideoGalleryListItemDto] })
  items: VideoGalleryListItemDto[];

  @ApiProperty({ description: '총 개수', example: 10 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 개수', example: 10 })
  limit: number;

  @ApiProperty({ description: '총 페이지 수', example: 2 })
  totalPages: number;
}

/**
 * 비디오갤러리 카테고리 응답 DTO
 */
export class VideoGalleryCategoryResponseDto {
  @ApiProperty({ description: '카테고리 ID' })
  id: string;

  @ApiProperty({ description: '카테고리 이름', example: '제품 소개' })
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '제품 소개 영상',
    required: false,
  })
  description?: string | null;

  @ApiProperty({ description: '활성화 여부', example: true })
  isActive: boolean;

  @ApiProperty({ description: '정렬 순서', example: 0 })
  order: number;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;
}

/**
 * 비디오갤러리 카테고리 목록 응답 DTO
 */
export class VideoGalleryCategoryListResponseDto {
  @ApiProperty({
    description: '카테고리 목록',
    type: [VideoGalleryCategoryResponseDto],
  })
  items: VideoGalleryCategoryResponseDto[];

  @ApiProperty({ description: '총 개수', example: 3 })
  total: number;
}
