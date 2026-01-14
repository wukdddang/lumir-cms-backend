import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnnouncementAttachmentDto } from './create-announcement.dto';

/**
 * 공지사항 수정 DTO
 */
export class UpdateAnnouncementDto {
  @ApiProperty({ description: '제목', example: '2024년 신년 인사', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: '내용',
    example: '새해 복 많이 받으세요.',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: '상단 고정 여부',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isFixed?: boolean;

  @ApiProperty({
    description: '공개 여부 (true=전사공개, false=제한공개)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: '공개 시작 일시',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  releasedAt?: string;

  @ApiProperty({
    description: '공개 종료 일시',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiredAt?: string;

  @ApiProperty({
    description: '필독 여부',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  mustRead?: boolean;

  @ApiProperty({
    description: '특정 직원 ID 목록 (SSO)',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionEmployeeIds?: string[];

  @ApiProperty({
    description: '직급 코드 목록',
    type: [String],
    example: ['매니저', '책임매니저'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionRankCodes?: string[];

  @ApiProperty({
    description: '직책 코드 목록',
    type: [String],
    example: ['팀장', '파트장'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionPositionCodes?: string[];

  @ApiProperty({
    description: '부서 코드 목록',
    type: [String],
    example: ['경영지원-경지', '연구-시스템'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionDepartmentCodes?: string[];

  @ApiProperty({
    description: '첨부파일 목록',
    type: [AnnouncementAttachmentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnnouncementAttachmentDto)
  attachments?: AnnouncementAttachmentDto[];

  @ApiProperty({ description: '정렬 순서', required: false })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 공지사항 공개 상태 수정 DTO
 */
export class UpdateAnnouncementPublicDto {
  @ApiProperty({ description: '공개 여부', example: true })
  @IsBoolean()
  isPublic: boolean;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 공지사항 고정 상태 수정 DTO
 */
export class UpdateAnnouncementFixedDto {
  @ApiProperty({ description: '고정 여부', example: true })
  @IsBoolean()
  isFixed: boolean;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 공지사항 오더 수정 DTO
 */
export class UpdateAnnouncementOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 공지사항 카테고리 생성 DTO
 */
export class CreateAnnouncementCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '인사' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '인사 관련 공지사항',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '정렬 순서',
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ description: '생성자 ID', required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

/**
 * 공지사항 카테고리 수정 DTO
 */
export class UpdateAnnouncementCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '인사', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '카테고리 설명',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '활성화 여부', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: '정렬 순서', required: false })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 공지사항 카테고리 오더 수정 DTO
 */
export class UpdateAnnouncementCategoryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
