import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  IsOptional,
  IsDate,
  IsNumber,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';
import type {
  AnnouncementStatus,
  AnnouncementCategory,
} from '@domain/core/common/types';

/**
 * 공지사항 생성 DTO
 */
export class CreateAnnouncementDto {
  @ApiProperty({ description: '제목', example: '2024년 1월 정기 공지사항' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: '내용',
    example: '다음 주 월요일은 전사 워크샵이 있습니다.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({
    description: '상단 고정 여부',
    example: false,
    default: false,
  })
  @IsBoolean()
  isFixed: boolean;

  @ApiProperty({
    description: '카테고리',
    example: { id: '1', name: '일반', description: '일반 공지사항' },
  })
  @IsNotEmpty()
  category: AnnouncementCategory;

  @ApiPropertyOptional({
    description: '공개 일시',
    example: '2024-01-15T09:00:00Z',
  })
  @IsOptional()
  @IsDate()
  releasedAt?: Date;

  @ApiPropertyOptional({
    description: '만료 일시',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDate()
  expiredAt?: Date;

  @ApiProperty({
    description: '필독 여부',
    example: true,
    default: false,
  })
  @IsBoolean()
  mustRead: boolean;

  @ApiProperty({ description: '관리자 ID', example: 'emp-001' })
  @IsNotEmpty()
  @IsString()
  managerId: string;

  @ApiPropertyOptional({
    description: '첨부파일 URL 목록',
    type: [String],
    example: ['https://storage.example.com/file1.pdf'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({
    description: '대상 직원 ID 목록',
    type: [String],
    example: ['emp-001', 'emp-002'],
  })
  @IsArray()
  @IsString({ each: true })
  employeeIds: string[];
}

/**
 * 공지사항 수정 DTO
 */
export class UpdateAnnouncementDto {
  @ApiPropertyOptional({ description: '제목' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({ description: '내용' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiPropertyOptional({ description: '상단 고정 여부' })
  @IsOptional()
  @IsBoolean()
  isFixed?: boolean;

  @ApiPropertyOptional({ description: '카테고리' })
  @IsOptional()
  category?: AnnouncementCategory;

  @ApiPropertyOptional({
    description: '상태',
    enum: ['draft', 'approved', 'under_review', 'rejected', 'opened'],
  })
  @IsOptional()
  @IsIn(['draft', 'approved', 'under_review', 'rejected', 'opened'])
  status?: AnnouncementStatus;

  @ApiPropertyOptional({ description: '공개 일시' })
  @IsOptional()
  @IsDate()
  releasedAt?: Date;

  @ApiPropertyOptional({ description: '만료 일시' })
  @IsOptional()
  @IsDate()
  expiredAt?: Date;

  @ApiPropertyOptional({ description: '필독 여부' })
  @IsOptional()
  @IsBoolean()
  mustRead?: boolean;

  @ApiPropertyOptional({ description: '첨부파일 URL 목록' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

/**
 * 카테고리 생성 DTO
 */
export class CreateAnnouncementCategoryDto {
  @ApiProperty({ description: '카테고리명', example: '긴급' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '긴급 공지사항 카테고리',
  })
  @IsNotEmpty()
  @IsString()
  description: string;
}

/**
 * 카테고리 수정 DTO
 */
export class UpdateAnnouncementCategoryDto {
  @ApiPropertyOptional({ description: '카테고리명' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '카테고리 설명' })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * 공지사항 응답 DTO
 */
export class AnnouncementResponseDto {
  @ApiProperty({ description: '공지사항 ID' })
  id: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ description: '내용' })
  content: string;

  @ApiProperty({ description: '상단 고정 여부' })
  isFixed: boolean;

  @ApiProperty({ description: '카테고리' })
  category: AnnouncementCategory;

  @ApiPropertyOptional({ description: '공개 일시' })
  releasedAt?: Date;

  @ApiPropertyOptional({ description: '만료 일시' })
  expiredAt?: Date;

  @ApiProperty({ description: '필독 여부' })
  mustRead: boolean;

  @ApiProperty({ description: '관리자 정보' })
  manager: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({ description: '상태' })
  status: AnnouncementStatus;

  @ApiProperty({ description: '조회수' })
  hits: number;

  @ApiProperty({ description: '첨부파일 URL 목록' })
  attachments: string[];

  @ApiProperty({ description: '대상 직원 수' })
  employeeCount: number;

  @ApiProperty({ description: '읽은 직원 수' })
  readCount: number;

  @ApiProperty({ description: '응답 제출한 직원 수' })
  submittedCount: number;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}

/**
 * 카테고리 응답 DTO
 */
export class AnnouncementCategoryResponseDto {
  @ApiProperty({ description: '카테고리 ID' })
  id: string;

  @ApiProperty({ description: '카테고리명' })
  name: string;

  @ApiProperty({ description: '카테고리 설명' })
  description: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}

/**
 * 첨부파일 응답 DTO
 */
export class AnnouncementAttachmentResponseDto {
  @ApiProperty({ description: '첨부파일 ID' })
  id: string;

  @ApiProperty({ description: '파일명' })
  fileName: string;

  @ApiProperty({ description: '파일 URL' })
  fileUrl: string;

  @ApiProperty({ description: '파일 크기 (bytes)' })
  fileSize: number;

  @ApiProperty({ description: '파일 타입' })
  mimeType: string;

  @ApiProperty({ description: '업로드 일시' })
  uploadedAt: Date;
}

/**
 * 대상자 응답 DTO
 */
export class AnnouncementTargetResponseDto {
  @ApiProperty({ description: '대상자 ID' })
  id: string;

  @ApiProperty({ description: '직원 ID' })
  employeeId: string;

  @ApiProperty({ description: '직원명' })
  employeeName: string;

  @ApiProperty({ description: '부서명' })
  departmentName: string;

  @ApiProperty({ description: '읽음 여부' })
  isRead: boolean;

  @ApiPropertyOptional({ description: '읽은 일시' })
  readAt?: Date;

  @ApiProperty({ description: '응답 제출 여부' })
  isSubmitted: boolean;

  @ApiPropertyOptional({ description: '응답 제출 일시' })
  submittedAt?: Date;

  @ApiPropertyOptional({ description: '응답 메시지' })
  responseMessage?: string;
}

/**
 * 응답 상태 응답 DTO
 */
export class AnnouncementRespondedResponseDto {
  @ApiProperty({ description: '응답 ID' })
  id: string;

  @ApiProperty({ description: '직원 ID' })
  employeeId: string;

  @ApiProperty({ description: '직원명' })
  employeeName: string;

  @ApiProperty({ description: '부서명' })
  departmentName: string;

  @ApiProperty({ description: '응답 메시지' })
  responseMessage: string;

  @ApiProperty({ description: '응답 일시' })
  respondedAt: Date;
}
