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
import { VideoSourceDto } from './create-video-gallery.dto';

/**
 * 비디오갤러리 수정 DTO
 */
export class UpdateVideoGalleryDto {
  @ApiProperty({
    description: '제목',
    example: '회사 소개 영상',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: '설명',
    example: '루미르 회사 소개 동영상입니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

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
    description: '비디오 소스 목록',
    type: [VideoSourceDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoSourceDto)
  videoSources?: VideoSourceDto[];
}

/**
 * 비디오갤러리 파일 수정 DTO
 */
export class UpdateVideoGalleryFileDto {
  @ApiProperty({
    description: '비디오 소스 목록',
    type: [VideoSourceDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoSourceDto)
  videoSources: VideoSourceDto[];
}

/**
 * 비디오갤러리 공개 상태 수정 DTO
 */
export class UpdateVideoGalleryPublicDto {
  @ApiProperty({ description: '공개 여부', example: true })
  @IsBoolean()
  isPublic: boolean;
}

/**
 * 비디오갤러리 오더 수정 DTO
 */
export class UpdateVideoGalleryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;
}

/**
 * 비디오갤러리 카테고리 생성 DTO
 */
export class CreateVideoGalleryCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '제품 소개' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '제품 소개 영상',
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
 * 비디오갤러리 카테고리 수정 DTO
 */
export class UpdateVideoGalleryCategoryDto {
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
 * 비디오갤러리 카테고리 오더 수정 DTO
 */
export class UpdateVideoGalleryCategoryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;
}
