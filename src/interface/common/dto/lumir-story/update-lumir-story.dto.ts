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
import { LumirStoryAttachmentDto } from './create-lumir-story.dto';

/**
 * 루미르스토리 수정 DTO
 */
export class UpdateLumirStoryDto {
  @ApiProperty({
    description: '제목',
    example: '루미르의 혁신 이야기',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: '내용',
    example: '루미르는 지속적으로 혁신을 추구하고 있습니다...',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: '카테고리 ID (UUID) - null 허용',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiProperty({
    description: '이미지 URL',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

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
    type: [LumirStoryAttachmentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LumirStoryAttachmentDto)
  attachments?: LumirStoryAttachmentDto[];
}

/**
 * 루미르스토리 파일 수정 DTO
 */
export class UpdateLumirStoryFileDto {
  @ApiProperty({
    description: '첨부파일 목록',
    type: [LumirStoryAttachmentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LumirStoryAttachmentDto)
  attachments: LumirStoryAttachmentDto[];
}

/**
 * 루미르스토리 공개 상태 수정 DTO
 */
export class UpdateLumirStoryPublicDto {
  @ApiProperty({ description: '공개 여부', example: true })
  @IsBoolean()
  isPublic: boolean;
}

/**
 * 루미르스토리 오더 수정 DTO
 */
export class UpdateLumirStoryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;
}

/**
 * 루미르스토리 카테고리 생성 DTO
 */
export class CreateLumirStoryCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '혁신' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '혁신 관련 스토리',
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
 * 루미르스토리 카테고리 수정 DTO
 */
export class UpdateLumirStoryCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '혁신', required: false })
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
 * 루미르스토리 카테고리 오더 수정 DTO
 */
export class UpdateLumirStoryCategoryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;
}
