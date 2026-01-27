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
 * 뉴스 첨부파일 DTO
 */
export class NewsAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'news_image.jpg' })
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
 * 뉴스 생성 DTO
 */
export class CreateNewsDto {
  @ApiProperty({
    description: '제목',
    example: '루미르 신제품 출시',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

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
    description: '카테고리 ID (UUID) - 선택사항',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

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
