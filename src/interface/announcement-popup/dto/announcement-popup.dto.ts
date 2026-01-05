import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  IsOptional,
} from 'class-validator';
import type {
  AnnouncementStatus,
  Language,
  AnnouncementCategory,
  Tag,
} from '@domain/core/common/types';

/**
 * 공지사항 팝업 생성 DTO
 */
export class CreateAnnouncementPopupDto {
  @ApiProperty({ description: '제목', example: '신규 복지 제도 안내' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: '상태',
    example: 'draft',
    default: 'draft',
  })
  @IsOptional()
  @IsString()
  status?: AnnouncementStatus;

  @ApiPropertyOptional({
    description: '공개 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: '카테고리',
    example: { id: '1', name: '복지', description: '복지 관련 공지' },
  })
  @IsNotEmpty()
  category: AnnouncementCategory;

  @ApiProperty({
    description: '언어',
    example: { code: 'ko', label: '한국어', name: 'korean' },
  })
  @IsNotEmpty()
  language: Language;

  @ApiProperty({ description: '관리자 ID' })
  @IsNotEmpty()
  @IsString()
  managerId: string;

  @ApiPropertyOptional({
    description: '태그 목록',
    type: [Object],
    default: [],
  })
  @IsOptional()
  @IsArray()
  tags?: Tag[];

  @ApiPropertyOptional({
    description: '첨부파일 URL 목록',
    type: [String],
    default: [],
  })
  @IsOptional()
  @IsArray()
  attachments?: string[];

  @ApiPropertyOptional({
    description: '공개 일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  releasedAt?: Date | string;
}

/**
 * 공지사항 팝업 수정 DTO
 */
export class UpdateAnnouncementPopupDto {
  @ApiPropertyOptional({ description: '제목' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '공개 여부' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '카테고리' })
  @IsOptional()
  category?: AnnouncementCategory;

  @ApiPropertyOptional({ description: '언어' })
  @IsOptional()
  language?: Language;

  @ApiPropertyOptional({ description: '태그 목록', type: [Object] })
  @IsOptional()
  @IsArray()
  tags?: Tag[];

  @ApiPropertyOptional({ description: '첨부파일 URL 목록', type: [String] })
  @IsOptional()
  @IsArray()
  attachments?: string[];

  @ApiPropertyOptional({
    description: '상태',
    enum: ['draft', 'approved', 'under_review', 'rejected', 'opened'],
  })
  @IsOptional()
  status?: AnnouncementStatus;
}

/**
 * 공지사항 팝업 응답 DTO
 */
export class AnnouncementPopupResponseDto {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ description: '공개 여부' })
  isPublic: boolean;

  @ApiProperty({ description: '상태' })
  status: AnnouncementStatus;

  @ApiProperty({ description: '카테고리' })
  category: AnnouncementCategory;

  @ApiProperty({ description: '언어' })
  language: Language;

  @ApiProperty({ description: '태그 목록' })
  tags: Tag[];

  @ApiProperty({ description: '관리자 정보' })
  manager: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({ description: '첨부파일 URL 목록' })
  attachments: string[];

  @ApiPropertyOptional({ description: '공개 일시' })
  releasedAt?: Date;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}
