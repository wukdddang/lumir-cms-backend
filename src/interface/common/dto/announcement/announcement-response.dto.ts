import { ApiProperty } from '@nestjs/swagger';
import { SurveyResponseDto } from '@interface/common/dto/survey/survey-response.dto';

/**
 * 공지사항 첨부파일 응답 DTO
 */
export class AnnouncementAttachmentResponseDto {
  @ApiProperty({ description: '파일명', example: 'announcement.pdf' })
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
 * 공지사항 응답 DTO
 */
export class AnnouncementResponseDto {
  @ApiProperty({ description: '공지사항 ID' })
  id: string;

  @ApiProperty({ description: '공지사항 카테고리 ID (UUID)' })
  categoryId: string;

  @ApiProperty({ description: '제목', example: '2024년 신년 인사' })
  title: string;

  @ApiProperty({
    description: '내용',
    example: '새해 복 많이 받으세요.',
  })
  content: string;

  @ApiProperty({ description: '상단 고정 여부', example: false })
  isFixed: boolean;

  @ApiProperty({
    description: '공개 여부 (true=전사공개, false=제한공개)',
    example: true,
  })
  isPublic: boolean;

  @ApiProperty({
    description: '공개 시작 일시',
    required: false,
    nullable: true,
  })
  releasedAt: Date | null;

  @ApiProperty({
    description: '공개 종료 일시',
    required: false,
    nullable: true,
  })
  expiredAt: Date | null;

  @ApiProperty({ description: '필독 여부', example: false })
  mustRead: boolean;

  @ApiProperty({
    description: '특정 직원 ID 목록 (SSO)',
    type: [String],
    required: false,
    nullable: true,
  })
  permissionEmployeeIds: string[] | null;

  @ApiProperty({
    description: '직급 ID 목록 (UUID)',
    type: [String],
    required: false,
    nullable: true,
  })
  permissionRankIds: string[] | null;

  @ApiProperty({
    description: '직책 ID 목록 (UUID)',
    type: [String],
    required: false,
    nullable: true,
  })
  permissionPositionIds: string[] | null;

  @ApiProperty({
    description: '부서 ID 목록 (UUID)',
    type: [String],
    required: false,
    nullable: true,
  })
  permissionDepartmentIds: string[] | null;

  @ApiProperty({
    description: '첨부파일 목록',
    type: [AnnouncementAttachmentResponseDto],
    required: false,
    nullable: true,
  })
  attachments: AnnouncementAttachmentResponseDto[] | null;

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

  @ApiProperty({
    description: '연결된 설문조사',
    type: SurveyResponseDto,
    required: false,
    nullable: true,
  })
  survey?: SurveyResponseDto | null;
}

/**
 * 공지사항 목록 아이템 DTO
 */
export class AnnouncementListItemDto {
  @ApiProperty({ description: '공지사항 ID' })
  id: string;

  @ApiProperty({ description: '공지사항 카테고리 ID (UUID)' })
  categoryId: string;

  @ApiProperty({ description: '제목', example: '2024년 신년 인사' })
  title: string;

  @ApiProperty({ description: '상단 고정 여부', example: false })
  isFixed: boolean;

  @ApiProperty({
    description: '공개 여부 (true=전사공개, false=제한공개)',
    example: true,
  })
  isPublic: boolean;

  @ApiProperty({ description: '필독 여부', example: false })
  mustRead: boolean;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  order: number;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;

  @ApiProperty({ description: '설문조사 포함 여부', example: false })
  hasSurvey: boolean;
}

/**
 * 공지사항 목록 응답 DTO
 */
export class AnnouncementListResponseDto {
  @ApiProperty({ description: '공지사항 목록', type: [AnnouncementListItemDto] })
  items: AnnouncementListItemDto[];

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
 * 공지사항 카테고리 응답 DTO
 */
export class AnnouncementCategoryResponseDto {
  @ApiProperty({ description: '카테고리 ID' })
  id: string;

  @ApiProperty({ description: '카테고리 이름', example: '인사' })
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '인사 관련 공지사항',
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
 * 공지사항 카테고리 목록 응답 DTO
 */
export class AnnouncementCategoryListResponseDto {
  @ApiProperty({
    description: '카테고리 목록',
    type: [AnnouncementCategoryResponseDto],
  })
  items: AnnouncementCategoryResponseDto[];

  @ApiProperty({ description: '총 개수', example: 3 })
  total: number;
}
