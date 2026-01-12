import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ContentStatus } from '@domain/core/content-status.types';

/**
 * 루미르스토리 공개 상태 수정 DTO
 */
export class UpdateLumirStoryPublicDto {
  @ApiProperty({ description: '공개 여부', example: true })
  @IsBoolean()
  isPublic: boolean;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 루미르스토리 오더 수정 DTO
 */
export class UpdateLumirStoryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
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

  @ApiProperty({ description: '생성자 ID', required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;
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

  @ApiProperty({ description: '정렬 순서', required: false })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/**
 * 루미르스토리 카테고리 오더 수정 DTO
 */
export class UpdateLumirStoryCategoryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
