import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  IsOptional,
  ValidateNested,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  AnnouncementStatus,
  Language,
  AnnouncementCategory,
  Tag,
} from '@domain/core/common/types';
import { ContentStatus } from '@domain/core/common/types';

/**
 * 태그 DTO (class-transformer를 위해)
 */
export class TagDto implements Tag {
  @ApiProperty({ description: '태그 ID', example: 'tag-001' })
  @IsString()
  id: string;

  @ApiProperty({ description: '태그 이름', example: '긴급' })
  @IsString()
  name: string;

  @ApiProperty({ description: '태그 설명', example: '긴급 공지' })
  @IsString()
  description: string;
}

/**
 * 공지사항 팝업 생성 DTO
 */
export class CreateAnnouncementPopupDto {
  @ApiProperty({ description: '제목', example: '신규 복지 제도 안내' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500, { message: '제목은 최대 500자까지 입력 가능합니다.' })
  title: string;

  @ApiPropertyOptional({
    description: '상태',
    example: 'draft',
    default: 'draft',
    enum: ContentStatus,
  })
  @IsOptional()
  @IsEnum(ContentStatus, { message: '유효하지 않은 상태 값입니다.' })
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
    type: [TagDto],
    default: [],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  tags?: TagDto[];

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
  @IsNotEmpty()
  @MaxLength(500, { message: '제목은 최대 500자까지 입력 가능합니다.' })
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

  @ApiPropertyOptional({ description: '태그 목록', type: [TagDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  tags?: TagDto[];

  @ApiPropertyOptional({ description: '첨부파일 URL 목록', type: [String] })
  @IsOptional()
  @IsArray()
  attachments?: string[];

  @ApiPropertyOptional({
    description: '상태',
    enum: ContentStatus,
  })
  @IsOptional()
  @IsEnum(ContentStatus, { message: '유효하지 않은 상태 값입니다.' })
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

  @ApiProperty({ description: '태그 목록', type: [TagDto] })
  tags: TagDto[];

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
