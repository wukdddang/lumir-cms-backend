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
import { ElectronicDisclosureAttachmentDto } from './create-electronic-disclosure.dto';

/**
 * 전자공시 번역 수정 DTO
 */
export class UpdateElectronicDisclosureTranslationDto {
  @ApiProperty({ description: '번역 ID', required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: '언어 ID' })
  @IsString()
  languageId: string;

  @ApiProperty({ description: '제목', example: '2024년 1분기 실적 공시' })
  @IsString()
  title: string;

  @ApiProperty({ description: '설명', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * 전자공시 수정 DTO
 */
export class UpdateElectronicDisclosureDto {
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
    type: [ElectronicDisclosureAttachmentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ElectronicDisclosureAttachmentDto)
  attachments?: ElectronicDisclosureAttachmentDto[];

  @ApiProperty({
    description: '번역 목록',
    type: [UpdateElectronicDisclosureTranslationDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateElectronicDisclosureTranslationDto)
  translations?: UpdateElectronicDisclosureTranslationDto[];

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 전자공시 공개 상태 수정 DTO
 */
export class UpdateElectronicDisclosurePublicDto {
  @ApiProperty({ description: '공개 여부', example: true })
  @IsBoolean()
  isPublic: boolean;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 전자공시 오더 수정 DTO
 */
export class UpdateElectronicDisclosureOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 전자공시 카테고리 생성 DTO
 */
export class CreateElectronicDisclosureCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '실적 공시' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '실적 관련 전자공시',
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
 * 전자공시 카테고리 수정 DTO
 */
export class UpdateElectronicDisclosureCategoryDto {
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
 * 카테고리 엔티티 수정 DTO
 */
export class UpdateCategoryEntityDto {
  @ApiProperty({ description: '카테고리 이름', example: '실적 공시', required: false })
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

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 전자공시 카테고리 오더 수정 DTO
 */
export class UpdateElectronicDisclosureCategoryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
