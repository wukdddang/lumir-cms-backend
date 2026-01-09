import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus } from '@domain/core/content-status.types';
import {
  BrochureTranslationDto,
  BrochureAttachmentDto,
} from './create-brochure.dto';

/**
 * 브로슈어 수정 DTO
 */
export class UpdateBrochureDto {
  @ApiProperty({ description: '공개 여부', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: '상태',
    enum: ContentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiProperty({ description: '정렬 순서', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({
    description: '첨부파일 목록',
    type: [BrochureAttachmentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrochureAttachmentDto)
  attachments?: BrochureAttachmentDto[];

  @ApiProperty({
    description: '번역 목록',
    type: [BrochureTranslationDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrochureTranslationDto)
  translations?: BrochureTranslationDto[];

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 브로슈어 공개 상태 수정 DTO
 */
export class UpdateBrochurePublicDto {
  @ApiProperty({ description: '공개 여부', example: true })
  @IsBoolean()
  isPublic: boolean;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 브로슈어 오더 수정 DTO
 */
export class UpdateBrochureOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 브로슈어 파일 수정 DTO
 */
export class UpdateBrochureFileDto {
  @ApiProperty({
    description: '첨부파일 목록',
    type: [BrochureAttachmentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrochureAttachmentDto)
  attachments: BrochureAttachmentDto[];

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 브로슈어 카테고리 생성 DTO
 */
export class CreateBrochureCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '제품 소개' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '제품 관련 브로슈어',
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
 * 브로슈어 카테고리 수정 DTO
 */
export class UpdateBrochureCategoryDto {
  @ApiProperty({ description: '카테고리 ID 목록', type: [String] })
  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 브로슈어 카테고리 오더 수정 DTO
 */
export class UpdateBrochureCategoryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
