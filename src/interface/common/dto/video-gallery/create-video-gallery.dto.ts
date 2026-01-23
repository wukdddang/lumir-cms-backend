import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 비디오 소스 DTO
 */
export class VideoSourceDto {
  @ApiProperty({
    description: '비디오 URL',
    example: 'https://www.youtube.com/watch?v=abc123',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: '비디오 타입',
    enum: ['upload', 'youtube'],
    example: 'youtube',
  })
  @IsString()
  type: 'upload' | 'youtube';

  @ApiProperty({
    description: '비디오 제목',
    example: '회사 소개 영상',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: '썸네일 URL',
    example: 'https://img.youtube.com/vi/abc123/0.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

/**
 * 비디오갤러리 생성 DTO
 */
export class CreateVideoGalleryDto {
  @ApiProperty({
    description: '제목',
    example: '회사 소개 영상',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

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
  })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

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
