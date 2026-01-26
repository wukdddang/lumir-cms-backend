import { ApiProperty } from '@nestjs/swagger';

/**
 * 전자공시 번역 응답 DTO
 */
export class ElectronicDisclosureTranslationResponseDto {
  @ApiProperty({ description: '번역 ID' })
  id: string;

  @ApiProperty({ description: '언어 ID' })
  languageId: string;

  @ApiProperty({ description: '제목', example: '2024년 1분기 실적 공시' })
  title: string;

  @ApiProperty({ description: '설명', required: false, nullable: true })
  description: string | null;
}

/**
 * 전자공시 첨부파일 DTO
 */
export class ElectronicDisclosureAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'disclosure_ko.pdf' })
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
 * 전자공시 응답 DTO
 */
export class ElectronicDisclosureResponseDto {
  @ApiProperty({ description: '전자공시 ID' })
  id: string;

  @ApiProperty({ description: '공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  order: number;

  @ApiProperty({
    description: '첨부파일 목록',
    type: [ElectronicDisclosureAttachmentDto],
    required: false,
    nullable: true,
  })
  attachments: ElectronicDisclosureAttachmentDto[] | null;

  @ApiProperty({
    description: '번역 목록',
    type: [ElectronicDisclosureTranslationResponseDto],
  })
  translations: ElectronicDisclosureTranslationResponseDto[];

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;

  @ApiProperty({ description: '생성자 ID', required: false, nullable: true })
  createdBy: string | null;

  @ApiProperty({ description: '수정자 ID', required: false, nullable: true })
  updatedBy: string | null;

  @ApiProperty({ description: '카테고리 ID' })  categoryId: string | null;

  @ApiProperty({ description: '카테고리 이름', example: '실적 공시', required: false })
  categoryName?: string;
}

/**
 * 전자공시 목록 아이템 DTO (한국어 번역 flatten)
 */
export class ElectronicDisclosureListItemDto {
  @ApiProperty({ description: '전자공시 ID' })
  id: string;

  @ApiProperty({ description: '공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  order: number;

  @ApiProperty({ description: '제목 (한국어)', example: '2024년 1분기 실적 공시' })
  title: string;

  @ApiProperty({
    description: '설명 (한국어)',
    required: false,
    nullable: true,
    example: '2024년 1분기 실적 공시 자료',
  })
  description: string | null;

  @ApiProperty({ description: '카테고리 이름', example: '실적 공시' })
  categoryName: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}

/**
 * 전자공시 목록 응답 DTO
 */
export class ElectronicDisclosureListResponseDto {
  @ApiProperty({
    description: '전자공시 목록',
    type: [ElectronicDisclosureListItemDto],
  })
  items: ElectronicDisclosureListItemDto[];

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
 * 전자공시 카테고리 응답 DTO
 */
export class ElectronicDisclosureCategoryResponseDto {
  @ApiProperty({ description: '카테고리 ID' })
  id: string;

  @ApiProperty({ description: '카테고리 이름', example: '실적 공시' })
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '실적 관련 전자공시',
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
 * 전자공시 카테고리 목록 응답 DTO
 */
export class ElectronicDisclosureCategoryListResponseDto {
  @ApiProperty({
    description: '카테고리 목록',
    type: [ElectronicDisclosureCategoryResponseDto],
  })
  items: ElectronicDisclosureCategoryResponseDto[];

  @ApiProperty({ description: '총 개수', example: 3 })
  total: number;
}
