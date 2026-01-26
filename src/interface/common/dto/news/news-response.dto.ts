import { ApiProperty } from '@nestjs/swagger';

/**
 * 뉴스 첨부파일 DTO
 */
export class NewsAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'news_document.pdf' })
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
 * 뉴스 응답 DTO
 */
export class NewsResponseDto {
  @ApiProperty({ description: '뉴스 ID' })
  id: string;

  @ApiProperty({ description: '제목', example: '루미르, 신제품 출시' })
  title: string;

  @ApiProperty({
    description: '설명',
    required: false,
    nullable: true,
    example: '루미르가 혁신적인 신제품을 출시했습니다.',
  })
  description: string | null;

  @ApiProperty({
    description: '외부 링크 또는 상세 페이지 URL',
    required: false,
    nullable: true,
    example: 'https://news.example.com/lumir-new-product',
  })
  url: string | null;

  @ApiProperty({
    description: '뉴스 카테고리 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId: string;

  @ApiProperty({ description: '공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({
    description: '첨부파일 목록',
    type: [NewsAttachmentDto],
    required: false,
    nullable: true,
  })
  attachments: NewsAttachmentDto[] | null;

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
 * 뉴스 목록 아이템 DTO
 */
export class NewsListItemDto {
  @ApiProperty({ description: '뉴스 ID' })
  id: string;

  @ApiProperty({ description: '제목', example: '루미르, 신제품 출시' })
  title: string;

  @ApiProperty({
    description: '설명',
    required: false,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: '외부 링크 또는 상세 페이지 URL',
    required: false,
    nullable: true,
  })
  url: string | null;

  @ApiProperty({
    description: '뉴스 카테고리 ID',
  })
  categoryId: string;

  @ApiProperty({ description: '카테고리 이름', example: '신제품' })
  categoryName: string;

  @ApiProperty({ description: '공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  order: number;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}

/**
 * 뉴스 목록 응답 DTO
 */
export class NewsListResponseDto {
  @ApiProperty({ description: '뉴스 목록', type: [NewsListItemDto] })
  items: NewsListItemDto[];

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
 * 뉴스 카테고리 응답 DTO
 */
export class NewsCategoryResponseDto {
  @ApiProperty({ description: '카테고리 ID' })
  id: string;

  @ApiProperty({ description: '카테고리 이름', example: '신제품' })
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '신제품 관련 뉴스',
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
 * 뉴스 카테고리 목록 응답 DTO
 */
export class NewsCategoryListResponseDto {
  @ApiProperty({
    description: '카테고리 목록',
    type: [NewsCategoryResponseDto],
  })
  items: NewsCategoryResponseDto[];

  @ApiProperty({ description: '총 개수', example: 3 })
  total: number;
}
