import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

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

  @ApiProperty({ description: '수정자 ID', required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
