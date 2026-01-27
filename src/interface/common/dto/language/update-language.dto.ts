import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNumber, IsInt } from 'class-validator';

/**
 * 언어 수정 DTO
 */
export class UpdateLanguageDto {
  @ApiProperty({ description: '언어 이름', example: '한국어', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '활성화 여부', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * 언어 활성 상태 수정 DTO
 */
export class UpdateLanguageActiveDto {
  @ApiProperty({ description: '활성화 여부', example: true })
  @IsBoolean()
  isActive: boolean;
}

/**
 * 언어 순서 수정 DTO
 */
export class UpdateLanguageOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  @IsInt() // 정수만 허용
  order: number;
}
