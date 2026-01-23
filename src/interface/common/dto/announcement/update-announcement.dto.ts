import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  ValidateNested,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnnouncementAttachmentDto } from './create-announcement.dto';
import { CreateSurveyWithoutAnnouncementDto } from '../survey/create-survey.dto';

/**
 * 공지사항 수정 DTO
 */
export class UpdateAnnouncementDto {
  @ApiProperty({
    description:
      '공지사항 카테고리 ID (UUID)\n\n' +
      '**필수 필드**\n\n' +
      '공지사항이 속할 카테고리를 지정합니다.\n' +
      'GET /admin/announcements/categories 엔드포인트로 카테고리 목록을 조회할 수 있습니다.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: '공지사항 제목\n\n목록과 상세 페이지에 표시될 제목입니다.',
    example: '2024년 신년 인사',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description:
      '공지사항 내용\n\n' +
      '공지사항의 본문 내용입니다.\n' +
      'HTML 형식을 지원할 수 있습니다.',
    example: '새해 복 많이 받으세요. 2024년에도 최선을 다하겠습니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description:
      '상단 고정 여부\n\n' +
      '`true`이면 공지사항 목록 상단에 고정됩니다.\n' +
      '중요한 공지사항에 사용합니다.',
    example: false,
    required: false,
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
      '파일은 미리 업로드된 상태여야 하며, URL과 메타데이터를 포함합니다.\n' +
      '이 배열을 전송하면 기존 첨부파일을 완전히 대체합니다.',
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
      '정렬 순서\n\n' +
      '공지사항 목록에서의 표시 순서입니다.\n' +
      '숫자가 작을수록 먼저 표시됩니다.',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({
    description:
      '설문조사 정보 (수정 또는 생성)\n\n' +
      '공지사항에 연결할 설문조사 데이터입니다.\n' +
      '기존 설문이 있으면 수정되고, 없으면 새로 생성됩니다.\n\n' +
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

/**
 * 공지사항 공개 상태 수정 DTO
 */
export class UpdateAnnouncementPublicDto {
  @ApiProperty({ description: '공개 여부', example: true })
  @IsBoolean()
  isPublic: boolean;
}

/**
 * 공지사항 고정 상태 수정 DTO
 */
export class UpdateAnnouncementFixedDto {
  @ApiProperty({ description: '고정 여부', example: true })
  @IsBoolean()
  isFixed: boolean;
}

/**
 * 공지사항 오더 수정 DTO
 */
export class UpdateAnnouncementOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;
}

/**
 * 공지사항 카테고리 생성 DTO
 */
export class CreateAnnouncementCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '인사' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    example: '인사 관련 공지사항',
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
}

/**
 * 공지사항 카테고리 수정 DTO
 */
export class UpdateAnnouncementCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '인사', required: false })
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
 * 공지사항 카테고리 오더 수정 DTO
 */
export class UpdateAnnouncementCategoryOrderDto {
  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  order: number;
}
