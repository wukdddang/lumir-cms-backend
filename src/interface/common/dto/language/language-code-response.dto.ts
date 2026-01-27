import { ApiProperty } from '@nestjs/swagger';

/**
 * 언어 코드 정보 DTO
 */
export class LanguageCodeInfoDto {
  @ApiProperty({
    description: '언어 코드 (ISO 639-1)',
    example: 'ko',
  })
  code: string;

  @ApiProperty({
    description: '언어의 영문 이름',
    example: 'Korean',
  })
  name: string;

  @ApiProperty({
    description: '언어의 원어 이름',
    example: '한국어',
  })
  nativeName: string;
}

/**
 * 언어 코드 목록 응답 DTO
 */
export class LanguageCodeListResponseDto {
  @ApiProperty({
    description: '사용 가능한 언어 코드 목록',
    type: [LanguageCodeInfoDto],
  })
  codes: LanguageCodeInfoDto[];

  @ApiProperty({
    description: '총 개수',
    example: 184,
  })
  total: number;
}
