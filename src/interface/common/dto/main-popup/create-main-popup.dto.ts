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
 * 메인 팝업 첨부파일 DTO
 */
export class MainPopupAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'popup_image.jpg' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: '파일 URL',
    example: 'https://s3.amazonaws.com/...',
  })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ description: '파일 크기 (bytes)', example: 512000 })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ description: 'MIME 타입', example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;
}

/**
 * 메인 팝업 번역 생성 DTO
 */
export class CreateMainPopupTranslationDto {
  @ApiProperty({
    description: '언어 ID',
    example: 'uuid-ko',
  })
  @IsString()
  @IsNotEmpty()
  languageId: string;

  @ApiProperty({
    description: '제목',
    example: '신제품 출시 안내',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '설명',
    example: '새로운 제품이 출시되었습니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * 메인 팝업 생성 DTO
 */
export class CreateMainPopupDto {
  @ApiProperty({
    description: '번역 목록 (여러 언어 동시 설정 가능)',
    type: [CreateMainPopupTranslationDto],
    example: [
      {
        languageId: 'uuid-ko',
        title: '신제품 출시 안내',
        description: '새로운 제품이 출시되었습니다.',
      },
      {
        languageId: 'uuid-en',
        title: 'New Product Launch',
        description: 'A new product has been launched.',
      },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateMainPopupTranslationDto)
  translations: CreateMainPopupTranslationDto[];

  @ApiProperty({
    description: '메인 팝업 카테고리 ID (선택사항)',
    example: 'uuid-category',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryId?: string | null;
}

/**
 * 메인 팝업 카테고리 생성 DTO
 */
export class CreateMainPopupCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '이벤트' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '이벤트 관련 팝업',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '정렬 순서', example: 0, required: false })
  @IsOptional()
  @IsNumber()
  order?: number;
}
