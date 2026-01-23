import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NewsAttachmentDto } from './create-news.dto';

/**
 * 뉴스 수정 DTO
 */
export class UpdateNewsDto {
  @ApiProperty({
    description: '제목',
    example: '루미르 신제품 출시',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: '설명',
    example: '루미르의 새로운 제품이 출시되었습니다...',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    description: '뉴스 URL',
    example: 'https://example.com/news/123',
    required: false,
  })
  @IsOptional()
  @IsString()
  url?: string | null;

  @ApiProperty({
    description: '카테고리 ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    description: '공개 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: '정렬 순서',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({
    description: '첨부파일 목록',
    type: [NewsAttachmentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewsAttachmentDto)
  attachments?: NewsAttachmentDto[];
}

/**
 * 뉴스 파일 수정 DTO
 */
export class UpdateNewsFileDto {
  @ApiProperty({
    description: '첨부파일 목록',
    type: [NewsAttachmentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewsAttachmentDto)
  attachments: NewsAttachmentDto[];
}

/**
 * 뉴스 공개 상태 수정 DTO
 */
export class UpdateNewsPublicDto {
  @ApiProperty({ description: '공개 여부', example: true })
  @IsBoolean()
  isPublic: boolean;
}

/**
 * 뉴스 오더 수정 DTO
 */
export class UpdateNewsOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;
}

/**
 * 뉴스 카테고리 생성 DTO
 */
export class CreateNewsCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '신제품' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '신제품 관련 뉴스',
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
 * 뉴스 카테고리 수정 DTO
 */
export class UpdateNewsCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '신제품', required: false })
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
 * 뉴스 카테고리 오더 수정 DTO
 */
export class UpdateNewsCategoryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;
}
