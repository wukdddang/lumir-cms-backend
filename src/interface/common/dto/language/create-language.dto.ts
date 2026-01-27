import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { IsLanguageCode } from '@interface/common/validators/is-language-code.validator';

/**
 * 언어 생성 DTO
 */
export class CreateLanguageDto {
  @ApiProperty({
    description: '언어 코드 (ISO 639-1 표준)',
    example: 'ko',
    type: String,
  })
  @IsLanguageCode()
  code: string;

  @ApiProperty({ description: '언어 이름', example: '한국어' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '활성화 여부',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
