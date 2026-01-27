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
 * 브로슈어 첨부파일 DTO (응답용)
 */
export class BrochureAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'brochure_ko.pdf' })
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

  @ApiProperty({ description: 'MIME 타입', example: 'application/pdf' })
  @IsString()
  mimeType: string;
}

/**
 * 브로슈어 번역 생성 DTO
 */
export class CreateBrochureTranslationDto {
  @ApiProperty({
    description: '언어 ID',
    example: 'uuid-ko',
  })
  @IsString()
  languageId: string;

  @ApiProperty({
    description: '제목',
    example: '회사 소개 브로슈어',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: '설명',
    example: '루미르 회사 소개 자료입니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * 브로슈어 생성 DTO
 */
export class CreateBrochureDto {
  @ApiProperty({
    description: '번역 목록 (여러 언어 동시 설정 가능)',
    type: [CreateBrochureTranslationDto],
    example: [
      {
        languageId: 'uuid-ko',
        title: '회사 소개 브로슈어',
        description: '루미르 회사 소개 자료입니다.',
      },
      {
        languageId: 'uuid-en',
        title: 'Company Introduction Brochure',
        description: 'Lumir company introduction material.',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBrochureTranslationDto)
  translations: CreateBrochureTranslationDto[];

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
    type: [BrochureAttachmentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrochureAttachmentDto)
  attachments?: BrochureAttachmentDto[];
}
