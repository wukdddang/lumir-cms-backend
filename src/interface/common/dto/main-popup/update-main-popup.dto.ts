import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 메인 팝업 카테고리 엔티티 수정 DTO
 */
export class UpdateMainPopupCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '이벤트', required: false })
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
 * 메인 팝업 카테고리 오더 수정 DTO
 */
export class UpdateMainPopupCategoryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  order: number;
}

/**
 * 메인 팝업 공개 상태 수정 DTO
 */
export class UpdateMainPopupPublicDto {
  @ApiProperty({ description: '공개 여부', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isPublic: boolean;
}

/**
 * 메인 팝업 번역 수정 DTO
 */
export class UpdateMainPopupTranslationDto {
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
 * 메인 팝업 수정 DTO
 */
export class UpdateMainPopupDto {
  @ApiProperty({
    description: '번역 목록 (여러 언어 동시 설정 가능)',
    type: [UpdateMainPopupTranslationDto],
    example: [
      {
        languageId: 'uuid-ko',
        title: '신제품 출시 안내',
        description: '새로운 제품이 출시되었습니다.',
      },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpdateMainPopupTranslationDto)
  translations: UpdateMainPopupTranslationDto[];

  @ApiProperty({
    description: '메인 팝업 카테고리 ID (선택사항)',
    example: 'uuid-category',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  categoryId?: string | null;
}
