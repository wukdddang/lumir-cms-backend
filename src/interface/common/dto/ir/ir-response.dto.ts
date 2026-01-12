import { ApiProperty } from '@nestjs/swagger';
import { ContentStatus } from '@domain/core/content-status.types';

/**
 * IR 번역 응답 DTO
 */
export class IRTranslationResponseDto {
  @ApiProperty({ description: '번역 ID' })
  id: string;

  @ApiProperty({ description: '언어 ID' })
  languageId: string;

  @ApiProperty({ description: '제목', example: '투자자 정보' })
  title: string;

  @ApiProperty({ description: '설명', required: false, nullable: true })
  description: string | null;
}

/**
 * IR 첨부파일 DTO
 */
export class IRAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'ir_report_ko.pdf' })
  fileName: string;

  @ApiProperty({
    description: '파일 URL',
    example: 'https://s3.amazonaws.com/...',
  })
  fileUrl: string;

  @ApiProperty({ description: '파일 크기 (bytes)', example: 1024000 })
  fileSize: number;

  @ApiProperty({ description: 'MIME 타입', example: 'application/pdf' })
  mimeType: string;
}

/**
 * IR 응답 DTO
 */
export class IRResponseDto {
  @ApiProperty({ description: 'IR ID' })
  id: string;

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

  @ApiProperty({
    description: '첨부파일 목록',
    type: [IRAttachmentDto],
    required: false,
    nullable: true,
  })
  attachments: IRAttachmentDto[] | null;

  @ApiProperty({
    description: '번역 목록',
    type: [IRTranslationResponseDto],
  })
  translations: IRTranslationResponseDto[];

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
 * IR 목록 아이템 DTO (한국어 번역 flatten)
 */
export class IRListItemDto {
  @ApiProperty({ description: 'IR ID' })
  id: string;

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

  @ApiProperty({ description: '제목 (한국어)', example: '투자자 정보' })
  title: string;

  @ApiProperty({
    description: '설명 (한국어)',
    required: false,
    nullable: true,
    example: 'IR 관련 자료',
  })
  description: string | null;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}

/**
 * IR 목록 응답 DTO
 */
export class IRListResponseDto {
  @ApiProperty({
    description: 'IR 목록',
    type: [IRListItemDto],
  })
  items: IRListItemDto[];

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
 * IR 카테고리 응답 DTO
 */
export class IRCategoryResponseDto {
  @ApiProperty({ description: '카테고리 ID' })
  id: string;

  @ApiProperty({ description: '카테고리 이름', example: '재무정보' })
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '재무 관련 IR',
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
 * IR 카테고리 목록 응답 DTO
 */
export class IRCategoryListResponseDto {
  @ApiProperty({
    description: '카테고리 목록',
    type: [IRCategoryResponseDto],
  })
  items: IRCategoryResponseDto[];

  @ApiProperty({ description: '총 개수', example: 3 })
  total: number;
}
