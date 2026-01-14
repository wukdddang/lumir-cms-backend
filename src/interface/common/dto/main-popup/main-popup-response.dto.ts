import { ApiProperty } from '@nestjs/swagger';

/**
 * 메인 팝업 번역 응답 DTO
 */
export class MainPopupTranslationResponseDto {
  @ApiProperty({ description: '번역 ID' })
  id: string;

  @ApiProperty({ description: '언어 ID' })
  languageId: string;

  @ApiProperty({ description: '제목', example: '메인 팝업' })
  title: string;

  @ApiProperty({ description: '설명', required: false, nullable: true })
  description: string | null;
}

/**
 * 메인 팝업 첨부파일 DTO
 */
export class MainPopupAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'popup_image_ko.jpg' })
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
 * 메인 팝업 응답 DTO
 */
export class MainPopupResponseDto {
  @ApiProperty({ description: '메인 팝업 ID' })
  id: string;

  @ApiProperty({ description: '공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  order: number;

  @ApiProperty({
    description: '공개 일시',
    required: false,
    nullable: true,
  })
  releasedAt: Date | null;

  @ApiProperty({
    description: '첨부파일 목록',
    type: [MainPopupAttachmentDto],
    required: false,
    nullable: true,
  })
  attachments: MainPopupAttachmentDto[] | null;

  @ApiProperty({
    description: '번역 목록',
    type: [MainPopupTranslationResponseDto],
  })
  translations: MainPopupTranslationResponseDto[];

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
 * 메인 팝업 목록 아이템 DTO (한국어 번역 flatten)
 */
export class MainPopupListItemDto {
  @ApiProperty({ description: '메인 팝업 ID' })
  id: string;

  @ApiProperty({ description: '공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  order: number;

  @ApiProperty({ description: '제목 (한국어)', example: '메인 팝업' })
  title: string;

  @ApiProperty({
    description: '설명 (한국어)',
    required: false,
    nullable: true,
    example: '메인 팝업 설명',
  })
  description: string | null;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}

/**
 * 메인 팝업 목록 응답 DTO
 */
export class MainPopupListResponseDto {
  @ApiProperty({
    description: '메인 팝업 목록',
    type: [MainPopupListItemDto],
  })
  items: MainPopupListItemDto[];

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
 * 메인 팝업 카테고리 응답 DTO
 */
export class MainPopupCategoryResponseDto {
  @ApiProperty({ description: '카테고리 ID' })
  id: string;

  @ApiProperty({ description: '카테고리 이름', example: '공지사항' })
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '공지사항 팝업',
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
 * 메인 팝업 카테고리 목록 응답 DTO
 */
export class MainPopupCategoryListResponseDto {
  @ApiProperty({
    description: '카테고리 목록',
    type: [MainPopupCategoryResponseDto],
  })
  items: MainPopupCategoryResponseDto[];

  @ApiProperty({ description: '총 개수', example: 3 })
  total: number;
}
