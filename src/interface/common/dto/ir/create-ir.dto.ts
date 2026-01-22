import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * IR 첨부파일 DTO
 */
export class IRAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'ir_report_q1_2024.pdf' })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: '파일 URL',
    example: 'https://s3.amazonaws.com/...',
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({ description: '파일 크기 (bytes)', example: 2048000 })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ description: 'MIME 타입', example: 'application/pdf' })
  @IsString()
  mimeType: string;
}

/**
 * IR 번역 생성 DTO
 */
export class CreateIRTranslationDto {
  @ApiProperty({
    description: '언어 ID',
    example: 'uuid-ko',
  })
  @IsString()
  languageId: string;

  @ApiProperty({
    description: '제목',
    example: 'IR 자료',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '설명',
    example: '투자자 정보 자료입니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * IR 생성 DTO
 */
export class CreateIRDto {
  @ApiProperty({
    description: '번역 목록 (여러 언어 동시 설정 가능)',
    type: [CreateIRTranslationDto],
    example: [
      {
        languageId: 'uuid-ko',
        title: 'IR 자료',
        description: '투자자 정보 자료입니다.',
      },
      {
        languageId: 'uuid-en',
        title: 'IR Material',
        description: 'Investor relations material.',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIRTranslationDto)
  translations: CreateIRTranslationDto[];

  @ApiProperty({
    description: 'IR 카테고리 ID (필수)',
    example: 'uuid-category',
  })
  @IsString()
  categoryId: string;
}
