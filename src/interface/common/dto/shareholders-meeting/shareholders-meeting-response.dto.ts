import { ApiProperty } from '@nestjs/swagger';

/**
 * 주주총회 번역 응답 DTO
 */
export class ShareholdersMeetingTranslationResponseDto {
  @ApiProperty({ description: '번역 ID' })
  id: string;

  @ApiProperty({ description: '언어 ID' })
  languageId: string;

  @ApiProperty({ description: '제목', example: '제28기 정기 주주총회' })
  title: string;

  @ApiProperty({ description: '설명', required: false, nullable: true })
  description: string | null;
}

/**
 * 주주총회 첨부파일 DTO
 */
export class ShareholdersMeetingAttachmentDto {
  @ApiProperty({ description: '파일명', example: 'meeting_minutes.pdf' })
  fileName: string;

  @ApiProperty({
    description: '파일 URL',
    example: 'https://s3.amazonaws.com/...',
  })
  fileUrl: string;

  @ApiProperty({ description: '파일 크기 (bytes)', example: 1024000 })
  fileSize: number;

  @ApiProperty({ description: 'MIME 타입', example: 'application/pdf' })
  mimeType: string;
}

/**
 * 의결 결과 번역 DTO
 */
export class VoteResultTranslationDto {
  @ApiProperty({ description: '번역 ID' })
  id: string;

  @ApiProperty({ description: '언어 ID' })
  languageId: string;

  @ApiProperty({ description: '안건 제목', example: '제1호 의안: 재무제표 승인' })
  title: string;
}

/**
 * 의결 결과 DTO
 */
export class VoteResultDto {
  @ApiProperty({ description: '의결 결과 ID' })
  id: string;

  @ApiProperty({ description: '안건 번호', example: 1 })
  agendaNumber: number;

  @ApiProperty({
    description: '찬성표 수',
    example: 1000000,
    required: false,
    nullable: true,
  })
  favorVotes: number | null;

  @ApiProperty({
    description: '반대표 수',
    example: 50000,
    required: false,
    nullable: true,
  })
  oppositionVotes: number | null;

  @ApiProperty({
    description: '기권표 수',
    example: 10000,
    required: false,
    nullable: true,
  })
  abstentionVotes: number | null;

  @ApiProperty({
    description: '번역 목록',
    type: [VoteResultTranslationDto],
  })
  translations: VoteResultTranslationDto[];

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}

/**
 * 주주총회 응답 DTO
 */
export class ShareholdersMeetingResponseDto {
  @ApiProperty({ description: '주주총회 ID' })
  id: string;

  @ApiProperty({ description: '공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({ description: '주주총회 장소', example: '서울 강남구 테헤란로 123' })
  location: string;

  @ApiProperty({ description: '주주총회 일시' })
  meetingDate: Date;

  @ApiProperty({
    description: '공개 일시',
    required: false,
    nullable: true,
  })
  releasedAt: Date | null;

  @ApiProperty({
    description: '대표 이미지 URL',
    example: 'https://s3.amazonaws.com/...',
    required: false,
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: '첨부파일 목록',
    type: [ShareholdersMeetingAttachmentDto],
    required: false,
    nullable: true,
  })
  attachments: ShareholdersMeetingAttachmentDto[] | null;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  order: number;

  @ApiProperty({
    description: '번역 목록',
    type: [ShareholdersMeetingTranslationResponseDto],
  })
  translations: ShareholdersMeetingTranslationResponseDto[];

  @ApiProperty({
    description: '의결 결과 목록',
    type: [VoteResultDto],
    required: false,
  })
  voteResults?: VoteResultDto[];

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;

  @ApiProperty({ description: '생성자 ID', required: false, nullable: true })
  createdBy: string | null;

  @ApiProperty({ description: '수정자 ID', required: false, nullable: true })
  updatedBy: string | null;

  @ApiProperty({ description: '카테고리 ID' })
  categoryId: string;

  @ApiProperty({ description: '카테고리 이름', example: '정기 주주총회', required: false })
  categoryName?: string;
}
