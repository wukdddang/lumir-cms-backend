import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BrochureAttachmentDto } from './create-brochure.dto';

/**
 * 브로슈어 번역 수정 DTO
 */
export class UpdateBrochureTranslationDto {
  @ApiProperty({ description: '번역 ID', required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: '언어 ID' })
  @IsString()
  languageId: string;

  @ApiProperty({ description: '제목', example: '회사 소개 브로슈어' })
  @IsString()
  title: string;

  @ApiProperty({ description: '설명', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * 브로슈어 수정 DTO
 */
export class UpdateBrochureDto {
  @ApiProperty({ description: '공개 여부', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

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
    type: [UpdateBrochureTranslationDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBrochureTranslationDto)
  translations?: UpdateBrochureTranslationDto[];
}

/**
 * 브로슈어 공개 상태 수정 DTO
 */
export class UpdateBrochurePublicDto {
  @ApiProperty({ description: '공개 여부', example: true })
  @IsBoolean()
  isPublic: boolean;
}

/**
 * 브로슈어 오더 수정 DTO
 */
export class UpdateBrochureOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;
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
}

/**
 * 브로슈어 카테고리 수정 DTO (브로슈어에 카테고리 매핑)
 */
export class UpdateBrochureCategoryDto {
  @ApiProperty({
    description: '카테고리 ID 목록',
    type: [String],
    example: ['31e6bbc6-2839-4477-9672-bb4b381e8914'],
  })
  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];
}

/**
 * 브로슈어 카테고리 엔티티 수정 DTO
 */
export class UpdateBrochureCategoryEntityDto {
  @ApiProperty({ description: '카테고리 이름', example: '제품 소개', required: false })
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
}

/**
 * 브로슈어 카테고리 오더 수정 DTO
 */
export class UpdateBrochureCategoryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;
}
