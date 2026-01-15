import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSurveyWithoutAnnouncementDto } from '../survey/create-survey.dto';

/**
 * 공지사항 첨부파일 DTO
 */
export class AnnouncementAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'announcement.pdf' })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: '파일 URL',
    example: 'https://s3.amazonaws.com/...',
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({ description: '파일 크기 (bytes)', example: 1024000 })
  fileSize: number;

  @ApiProperty({ description: 'MIME 타입', example: 'application/pdf' })
  @IsString()
  mimeType: string;
}

/**
 * 공지사항 생성 DTO
 */
export class CreateAnnouncementDto {
  @ApiProperty({ description: '제목', example: '2024년 신년 인사' })
  @IsString()
  title: string;

  @ApiProperty({
    description: '내용',
    example: '새해 복 많이 받으세요.',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: '상단 고정 여부',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFixed?: boolean;

  @ApiProperty({
    description: '공개 여부 (true=전사공개, false=제한공개)',
    example: true,
    required: false,
    default: true,
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
    default: false,
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
    description: '직급 ID 목록 (UUID)',
    type: [String],
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionRankIds?: string[];

  @ApiProperty({
    description: '직책 ID 목록 (UUID)',
    type: [String],
    example: ['c3d4e5f6-a7b8-9012-cdef-123456789012', 'd4e5f6a7-b890-1234-def0-234567890123'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionPositionIds?: string[];

  @ApiProperty({
    description: '부서 ID 목록 (UUID)',
    type: [String],
    example: ['e2b3b884-833c-4fdb-ba00-ede1a45b8160', 'c11023a2-fb66-4e3f-bfcf-0666fb19f6bf'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionDepartmentIds?: string[];

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

  @ApiProperty({ description: '생성자 ID', required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({
    description: '설문조사 정보',
    type: CreateSurveyWithoutAnnouncementDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSurveyWithoutAnnouncementDto)
  survey?: CreateSurveyWithoutAnnouncementDto;
}
