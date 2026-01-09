import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsBoolean, 
  IsNumber, 
  IsArray, 
  IsOptional, 
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus } from '@domain/core/content-status.types';

/**
 * 브로슈어 번역 DTO
 */
export class BrochureTranslationDto {
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
 * 브로슈어 첨부파일 DTO
 */
export class BrochureAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'brochure_ko.pdf' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: '파일 URL', example: 'https://s3.amazonaws.com/...' })
  @IsString()
  fileUrl: string;

  @ApiProperty({ description: '파일 크기 (bytes)', example: 1024000 })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ description: 'MIME 타입', example: 'application/pdf' })
  @IsString()
  mimeType: string;
}

/**
 * 브로슈어 생성 DTO
 */
export class CreateBrochureDto {
  @ApiProperty({ description: '공개 여부', example: true, default: true })
  @IsBoolean()
  isPublic: boolean;

  @ApiProperty({ 
    description: '상태', 
    enum: ContentStatus,
    example: ContentStatus.DRAFT,
    default: ContentStatus.DRAFT,
  })
  @IsEnum(ContentStatus)
  status: ContentStatus;

  @ApiProperty({ description: '정렬 순서', example: 1, default: 0 })
  @IsNumber()
  order: number;

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
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 하나의 번역이 필요합니다.' })
  @ValidateNested({ each: true })
  @Type(() => BrochureTranslationDto)
  translations: BrochureTranslationDto[];

  @ApiProperty({ description: '생성자 ID', required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
