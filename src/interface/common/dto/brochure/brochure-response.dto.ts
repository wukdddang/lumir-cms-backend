import { ApiProperty } from '@nestjs/swagger';

/**
 * 브로슈어 번역 응답 DTO
 */
export class BrochureTranslationResponseDto {
  @ApiProperty({ description: '번역 ID' })
  id: string;

  @ApiProperty({ description: '언어 ID' })
  languageId: string;

  @ApiProperty({ description: '제목', example: '회사 소개 브로슈어' })
  title: string;

  @ApiProperty({ description: '설명', required: false, nullable: true })
  description: string | null;
}

/**
 * 브로슈어 첨부파일 DTO
 */
export class BrochureAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'brochure_ko.pdf' })
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
 * 브로슈어 응답 DTO
 */
export class BrochureResponseDto {
  @ApiProperty({ description: '브로슈어 ID' })
  id: string;

  @ApiProperty({ description: '공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  order: number;

  @ApiProperty({
    description: '첨부파일 목록',
    type: [BrochureAttachmentDto],
    required: false,
    nullable: true,
  })
  attachments: BrochureAttachmentDto[] | null;

  @ApiProperty({
    description: '번역 목록',
    type: [BrochureTranslationResponseDto],
  })
  translations: BrochureTranslationResponseDto[];

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;

  @ApiProperty({ description: '생성자 ID', required: false, nullable: true })
  createdBy: string | null;

  @ApiProperty({ description: '수정자 ID', required: false, nullable: true })
  updatedBy: string | null;

  @ApiProperty({ description: '카테고리 ID', nullable: true })
  categoryId: string | null;

  @ApiProperty({ description: '카테고리 이름', example: '회사 소개', required: false })
  categoryName?: string;
}

/**
 * 브로슈어 목록 아이템 DTO (한국어 번역 flatten)
 */
export class BrochureListItemDto {
  @ApiProperty({ description: '브로슈어 ID' })
  id: string;

  @ApiProperty({ description: '공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  order: number;

  @ApiProperty({ description: '제목 (한국어)', example: '회사 소개 브로슈어' })
  title: string;

  @ApiProperty({
    description: '설명 (한국어)',
    required: false,
    nullable: true,
    example: '회사 소개 자료',
  })
  description: string | null;

  @ApiProperty({ description: '카테고리 이름', example: '회사 소개' })
  categoryName: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}

/**
 * 브로슈어 목록 응답 DTO
 */
export class BrochureListResponseDto {
  @ApiProperty({ description: '브로슈어 목록', type: [BrochureListItemDto] })
  items: BrochureListItemDto[];

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
 * 브로슈어 카테고리 응답 DTO
 */
export class BrochureCategoryResponseDto {
  @ApiProperty({ description: '카테고리 ID' })
  id: string;

  @ApiProperty({ description: '카테고리 이름', example: '제품 소개' })
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '제품 관련 브로슈어',
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
 * 브로슈어 카테고리 목록 응답 DTO
 */
export class BrochureCategoryListResponseDto {
  @ApiProperty({
    description: '카테고리 목록',
    type: [BrochureCategoryResponseDto],
  })
  items: BrochureCategoryResponseDto[];

  @ApiProperty({ description: '총 개수', example: 3 })
  total: number;
}
