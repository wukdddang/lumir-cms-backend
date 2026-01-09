import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsBoolean, IsOptional } from 'class-validator';
import { LanguageCode } from '@domain/common/language/language-code.types';

/**
 * 언어 생성 DTO
 */
export class CreateLanguageDto {
  @ApiProperty({ description: '언어 코드', example: 'ko', enum: ['ko', 'en', 'ja', 'zh'] })
  @IsEnum(['ko', 'en', 'ja', 'zh'])
  code: LanguageCode;

  @ApiProperty({ description: '언어 이름', example: '한국어' })
  @IsString()
  name: string;

  @ApiProperty({ description: '활성화 여부', example: true, default: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: '생성자 ID', required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
