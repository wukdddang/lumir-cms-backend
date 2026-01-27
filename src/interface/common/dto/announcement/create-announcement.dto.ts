import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsDateString,
  ValidateNested,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSurveyWithoutAnnouncementDto } from '../survey/create-survey.dto';

/**
 * 공지사항 첨부파일 DTO
 */
export class AnnouncementAttachmentDto {
  @ApiProperty({
    description: '파일명\n\n원본 파일의 이름입니다.',
    example: 'announcement.pdf',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description:
      '파일 URL\n\n' +
      '업로드된 파일에 접근할 수 있는 URL입니다.\n' +
      'S3 또는 스토리지 서비스의 URL을 입력합니다.',
    example: 'https://s3.amazonaws.com/bucket-name/path/to/file.pdf',
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({
    description: '파일 크기 (bytes)\n\n파일의 크기를 바이트 단위로 나타냅니다.',
    example: 1024000,
  })
  fileSize: number;

  @ApiProperty({
    description:
      'MIME 타입\n\n' +
      '파일의 MIME 타입입니다.\n' +
      '예: `application/pdf`, `image/jpeg`, `image/png` 등',
    example: 'application/pdf',
  })
  @IsString()
  mimeType: string;
}

/**
 * 공지사항 생성 DTO
 */
export class CreateAnnouncementDto {
  @ApiProperty({
    description:
      '공지사항 카테고리 ID (UUID) - 선택사항\n\n' +
      '공지사항이 속할 카테고리를 지정합니다.\n' +
      'GET /admin/announcements/categories 엔드포인트로 카테고리 목록을 조회할 수 있습니다.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiProperty({
    description: '공지사항 제목\n\n목록과 상세 페이지에 표시될 제목입니다.',
    example: '2024년 신년 인사',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description:
      '공지사항 내용\n\n' +
      '공지사항의 본문 내용입니다.\n' +
      'HTML 형식을 지원할 수 있습니다.',
    example: '새해 복 많이 받으세요. 2024년에도 최선을 다하겠습니다.',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description:
      '상단 고정 여부\n\n' +
      '`true`이면 공지사항 목록 상단에 고정됩니다.\n' +
      '중요한 공지사항에 사용합니다.',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFixed?: boolean;

  @ApiProperty({
    description:
      '공개 여부\n\n' +
      '- `true`: 전사공개 - 모든 직원에게 공개\n' +
      '- `false`: 제한공개 - 권한 설정에 따라 특정 직원/부서/직급/직책에만 공개',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description:
      '공개 시작 일시 (ISO 8601 형식)\n\n' +
      '공지사항이 공개되기 시작하는 날짜와 시간입니다.\n' +
      '이 시간 이전에는 공지사항이 표시되지 않습니다.',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  releasedAt?: string;

  @ApiProperty({
    description:
      '공개 종료 일시 (ISO 8601 형식)\n\n' +
      '공지사항 공개가 종료되는 날짜와 시간입니다.\n' +
      '이 시간 이후에는 공지사항이 표시되지 않습니다.',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiredAt?: string;

  @ApiProperty({
    description:
      '필독 여부\n\n' +
      '`true`이면 직원들이 반드시 읽어야 하는 공지사항으로 표시됩니다.\n' +
      '읽음 확인 기능과 연동될 수 있습니다.',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  mustRead?: boolean;

  @ApiProperty({
    description:
      '특정 직원 ID 목록 (SSO ID)\n\n' +
      '**제한공개 시 사용**\n\n' +
      '공지사항을 볼 수 있는 특정 직원들의 SSO ID 목록입니다.\n' +
      '`isPublic=false`일 때만 적용됩니다.',
    type: [String],
    example: ['employee-uuid-1', 'employee-uuid-2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionEmployeeIds?: string[];

  @ApiProperty({
    description:
      '직급 ID 목록 (UUID)\n\n' +
      '**제한공개 시 사용**\n\n' +
      '공지사항을 볼 수 있는 직급의 UUID 목록입니다.\n' +
      '예: 대리, 과장, 차장 등의 직급 ID\n' +
      '`isPublic=false`일 때만 적용됩니다.',
    type: [String],
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionRankIds?: string[];

  @ApiProperty({
    description:
      '직책 ID 목록 (UUID)\n\n' +
      '**제한공개 시 사용**\n\n' +
      '공지사항을 볼 수 있는 직책의 UUID 목록입니다.\n' +
      '예: 팀장, 실장, 본부장 등의 직책 ID\n' +
      '`isPublic=false`일 때만 적용됩니다.',
    type: [String],
    example: ['c3d4e5f6-a7b8-9012-cdef-123456789012', 'd4e5f6a7-b890-1234-def0-234567890123'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionPositionIds?: string[];

  @ApiProperty({
    description:
      '부서 ID 목록 (UUID)\n\n' +
      '**제한공개 시 사용**\n\n' +
      '공지사항을 볼 수 있는 부서의 UUID 목록입니다.\n' +
      '예: 개발팀, 마케팅팀, 인사팀 등의 부서 ID\n' +
      '`isPublic=false`일 때만 적용됩니다.',
    type: [String],
    example: ['e2b3b884-833c-4fdb-ba00-ede1a45b8160', 'c11023a2-fb66-4e3f-bfcf-0666fb19f6bf'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionDepartmentIds?: string[];

  @ApiProperty({
    description:
      '첨부파일 목록\n\n' +
      '공지사항에 첨부할 파일들의 정보입니다.\n' +
      '파일은 미리 업로드된 상태여야 하며, URL과 메타데이터를 포함합니다.',
    type: [AnnouncementAttachmentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnnouncementAttachmentDto)
  attachments?: AnnouncementAttachmentDto[];

  @ApiProperty({
    description:
      '설문조사 정보\n\n' +
      '공지사항에 연결할 설문조사 데이터입니다.\n' +
      '공지사항과 함께 설문을 생성하려면 이 필드를 포함시킵니다.\n\n' +
      '**설문 예시:**\n' +
      '```json\n' +
      '{\n' +
      '  "title": "만족도 조사",\n' +
      '  "description": "의견을 들려주세요",\n' +
      '  "startDate": "2024-01-01T00:00:00Z",\n' +
      '  "endDate": "2024-12-31T23:59:59Z",\n' +
      '  "questions": [\n' +
      '    {\n' +
      '      "title": "만족도를 선택해주세요",\n' +
      '      "type": "multiple_choice",\n' +
      '      "form": {\n' +
      '        "options": ["매우 만족", "만족", "보통", "불만족"]\n' +
      '      },\n' +
      '      "isRequired": true,\n' +
      '      "order": 0\n' +
      '    }\n' +
      '  ]\n' +
      '}\n' +
      '```',
    type: CreateSurveyWithoutAnnouncementDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSurveyWithoutAnnouncementDto)
  survey?: CreateSurveyWithoutAnnouncementDto;
}
