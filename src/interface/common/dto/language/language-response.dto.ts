import { ApiProperty } from '@nestjs/swagger';

/**
 * 언어 응답 DTO
 */
export class LanguageResponseDto {
  @ApiProperty({ description: '언어 ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: '언어 코드 (ISO 639-1)', example: 'ko', type: String })
  code: string;

  @ApiProperty({ description: '언어 이름', example: '한국어' })
  name: string;

  @ApiProperty({ description: '활성화 여부', example: true })
  isActive: boolean;

  @ApiProperty({ description: '정렬 순서', example: 0 })
  order: number;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;

  @ApiProperty({ description: '생성자 ID', required: false, nullable: true })
  createdBy: string | null;

  @ApiProperty({ description: '수정자 ID', required: false, nullable: true })
  updatedBy: string | null;
}

/**
 * 언어 목록 응답 DTO
 */
export class LanguageListResponseDto {
  @ApiProperty({ description: '언어 목록', type: [LanguageResponseDto] })
  items: LanguageResponseDto[];

  @ApiProperty({ description: '총 개수', example: 4 })
  total: number;
}
