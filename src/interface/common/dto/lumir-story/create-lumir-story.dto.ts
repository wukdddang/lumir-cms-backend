import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 루미르스토리 첨부파일 DTO
 */
export class LumirStoryAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'story_image.jpg' })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: '파일 URL',
    example: 'https://s3.amazonaws.com/...',
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({ description: '파일 크기 (bytes)', example: 1024000 })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ description: 'MIME 타입', example: 'image/jpeg' })
  @IsString()
  mimeType: string;
}

/**
 * 루미르스토리 생성 DTO
 */
export class CreateLumirStoryDto {
  @ApiProperty({
    description: '제목',
    example: '루미르의 혁신 이야기',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: '내용',
    example: '루미르는 지속적으로 혁신을 추구하고 있습니다...',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: '카테고리 ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiProperty({
    description: '이미지 URL',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

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
