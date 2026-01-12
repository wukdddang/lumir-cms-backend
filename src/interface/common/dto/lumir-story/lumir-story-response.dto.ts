import { ApiProperty } from '@nestjs/swagger';
import { ContentStatus } from '@domain/core/content-status.types';

/**
 * 루미르스토리 첨부파일 DTO
 */
export class LumirStoryAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'story_image.jpg' })
  fileName: string;

  @ApiProperty({
    description: '파일 URL',
    example: 'https://s3.amazonaws.com/...',
  })
  fileUrl: string;

  @ApiProperty({ description: '파일 크기 (bytes)', example: 1024000 })
  fileSize: number;

  @ApiProperty({ description: 'MIME 타입', example: 'image/jpeg' })
  mimeType: string;
}

/**
 * 루미르스토리 응답 DTO
 */
export class LumirStoryResponseDto {
  @ApiProperty({ description: '루미르스토리 ID' })
  id: string;

  @ApiProperty({ description: '제목', example: '루미르의 혁신 이야기' })
  title: string;

  @ApiProperty({ description: '내용', example: '루미르는...' })
  content: string;

  @ApiProperty({
    description: '썸네일/대표 이미지 URL',
    required: false,
    nullable: true,
  })
  imageUrl: string | null;

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
    type: [LumirStoryAttachmentDto],
    required: false,
    nullable: true,
  })
  attachments: LumirStoryAttachmentDto[] | null;

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
 * 루미르스토리 목록 아이템 DTO
 */
export class LumirStoryListItemDto {
  @ApiProperty({ description: '루미르스토리 ID' })
  id: string;

  @ApiProperty({ description: '제목', example: '루미르의 혁신 이야기' })
  title: string;

  @ApiProperty({
    description: '썸네일/대표 이미지 URL',
    required: false,
    nullable: true,
  })
  imageUrl: string | null;

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
 * 루미르스토리 목록 응답 DTO
 */
export class LumirStoryListResponseDto {
  @ApiProperty({ description: '루미르스토리 목록', type: [LumirStoryListItemDto] })
  items: LumirStoryListItemDto[];

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
 * 루미르스토리 카테고리 응답 DTO
 */
export class LumirStoryCategoryResponseDto {
  @ApiProperty({ description: '카테고리 ID' })
  id: string;

  @ApiProperty({ description: '카테고리 이름', example: '혁신' })
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '혁신 관련 스토리',
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
 * 루미르스토리 카테고리 목록 응답 DTO
 */
export class LumirStoryCategoryListResponseDto {
  @ApiProperty({
    description: '카테고리 목록',
    type: [LumirStoryCategoryResponseDto],
  })
  items: LumirStoryCategoryResponseDto[];

  @ApiProperty({ description: '총 개수', example: 3 })
  total: number;
}
