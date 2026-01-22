import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  ValidateNested,
  IsBoolean,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InqueryType } from '@domain/sub/survey/inquery-type.types';

/**
 * 설문 질문 폼 데이터 DTO
 */
export class SurveyQuestionFormDto {
  @ApiProperty({
    description:
      '선택지 목록\n\n' +
      '**사용 타입:** `multiple_choice`, `dropdown`, `checkboxes`\n\n' +
      '객관식, 드롭다운, 체크박스 타입에서 사용자가 선택할 수 있는 옵션 목록입니다.',
    type: [String],
    example: ['매우 만족', '만족', '보통', '불만족', '매우 불만족'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({
    description:
      '최소 척도값\n\n' +
      '**사용 타입:** `linear_scale`\n\n' +
      '선형 척도의 최소값을 설정합니다. (일반적으로 1 또는 0)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  minScale?: number;

  @ApiProperty({
    description:
      '최대 척도값\n\n' +
      '**사용 타입:** `linear_scale`\n\n' +
      '선형 척도의 최대값을 설정합니다. (일반적으로 5 또는 10)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxScale?: number;

  @ApiProperty({
    description:
      '행(Row) 목록\n\n' +
      '**사용 타입:** `grid_scale`\n\n' +
      '그리드 척도에서 세로축에 표시될 항목 목록입니다.',
    type: [String],
    example: ['서비스 품질', '응대 태도', '처리 속도', '전문성'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rows?: string[];

  @ApiProperty({
    description:
      '열(Column) 목록\n\n' +
      '**사용 타입:** `grid_scale`\n\n' +
      '그리드 척도에서 가로축에 표시될 평가 척도입니다.',
    type: [String],
    example: ['매우 불만족', '불만족', '보통', '만족', '매우 만족'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  @ApiProperty({
    description:
      '허용된 파일 타입 (MIME 타입)\n\n' +
      '**사용 타입:** `file_upload`\n\n' +
      '업로드 가능한 파일의 MIME 타입 목록입니다.\n' +
      '예: `image/jpeg`, `image/png`, `application/pdf`, `application/zip` 등',
    type: [String],
    example: ['image/jpeg', 'image/png', 'application/pdf'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  @ApiProperty({
    description:
      '최대 파일 크기 (bytes)\n\n' +
      '**사용 타입:** `file_upload`\n\n' +
      '업로드 가능한 파일의 최대 크기를 바이트 단위로 지정합니다.\n' +
      '예: 5242880 = 5MB, 10485760 = 10MB',
    example: 5242880,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxFileSize?: number;
}

/**
 * 설문 질문 DTO
 */
export class SurveyQuestionDto {
  @ApiProperty({
    description: '질문 제목\n\n응답자에게 표시될 질문 내용입니다.',
    example: '업무 환경에 대해 얼마나 만족하십니까?',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 
      '질문 타입\n\n' +
      '**사용 가능한 타입:**\n\n' +
      '- `short_answer`: 단답형 - 짧은 텍스트 입력 (한 줄)\n' +
      '- `paragraph`: 장문형 - 긴 텍스트 입력 (여러 줄)\n' +
      '- `multiple_choice`: 객관식 - 단일 선택 (라디오 버튼)\n' +
      '- `dropdown`: 드롭다운 - 단일 선택 (선택 박스)\n' +
      '- `checkboxes`: 체크박스 - 다중 선택 가능\n' +
      '- `file_upload`: 파일 업로드 - 파일 첨부\n' +
      '- `datetime`: 날짜/시간 선택 - 날짜 또는 시간 입력\n' +
      '- `linear_scale`: 선형 척도 - 숫자 척도 (예: 1~10)\n' +
      '- `grid_scale`: 그리드 척도 - 여러 항목을 동일한 척도로 평가',
    enum: InqueryType,
    example: InqueryType.MULTIPLE_CHOICE,
  })
  @IsEnum(InqueryType)
  type: InqueryType;

  @ApiProperty({
    description:
      '질문 폼 데이터 (타입별 추가 옵션)\n\n' +
      '질문 타입에 따라 필요한 추가 설정값입니다.\n\n' +
      '**타입별 필요 필드:**\n' +
      '- `multiple_choice`, `dropdown`, `checkboxes`: `options` 필수\n' +
      '- `linear_scale`: `minScale`, `maxScale` 필수\n' +
      '- `grid_scale`: `rows`, `columns` 필수\n' +
      '- `file_upload`: `allowedFileTypes`, `maxFileSize` 선택\n' +
      '- `short_answer`, `paragraph`, `datetime`: 추가 필드 불필요',
    type: SurveyQuestionFormDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SurveyQuestionFormDto)
  form?: SurveyQuestionFormDto;

  @ApiProperty({
    description:
      '필수 응답 여부\n\n' +
      '`true`이면 사용자가 반드시 이 질문에 답변해야 설문을 완료할 수 있습니다.',
    example: true,
    default: false,
  })
  @IsBoolean()
  isRequired: boolean;

  @ApiProperty({
    description:
      '질문 정렬 순서\n\n' +
      '질문이 표시되는 순서입니다. 숫자가 작을수록 먼저 표시됩니다.',
    example: 0,
    default: 0,
  })
  @IsNumber()
  order: number;
}

/**
 * 설문조사 생성 DTO (독립 생성용)
 */
export class CreateSurveyDto {
  @ApiProperty({
    description: '공지사항 ID',
    example: 'uuid-announcement-id',
  })
  @IsString()
  announcementId: string;

  @ApiProperty({
    description: '설문조사 제목',
    example: '2024년 직원 만족도 조사',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '설문조사 설명',
    example: '우리 회사의 발전을 위한 소중한 의견을 들려주세요.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '설문 시작 일시',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: '설문 마감 일시',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: '정렬 순서',
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({
    description: '설문 질문 목록',
    type: [SurveyQuestionDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionDto)
  questions?: SurveyQuestionDto[];
}

/**
 * 설문조사 생성 DTO (공지사항 포함용 - announcementId 제외)
 */
export class CreateSurveyWithoutAnnouncementDto {
  @ApiProperty({
    description: '설문조사 제목\n\n설문조사의 제목으로, 공지사항 내에서 표시됩니다.',
    example: '2024년 직원 만족도 조사',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description:
      '설문조사 설명\n\n' +
      '설문조사에 대한 상세 설명입니다. 응답자에게 설문의 목적이나 유의사항을 안내할 수 있습니다.',
    example: '우리 회사의 발전을 위한 소중한 의견을 들려주세요. 솔직한 답변 부탁드립니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      '설문 시작 일시 (ISO 8601 형식)\n\n' +
      '설문 응답을 시작할 수 있는 날짜와 시간입니다.\n' +
      '이 시간 이전에는 설문 응답이 불가능합니다.',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description:
      '설문 마감 일시 (ISO 8601 형식)\n\n' +
      '설문 응답을 마감하는 날짜와 시간입니다.\n' +
      '이 시간 이후에는 설문 응답이 불가능합니다.',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description:
      '정렬 순서\n\n' +
      '여러 설문이 있을 경우 표시 순서를 지정합니다.\n' +
      '숫자가 작을수록 먼저 표시됩니다.',
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({
    description:
      '설문 질문 목록\n\n' +
      '설문조사에 포함될 질문들의 배열입니다.\n' +
      '각 질문은 타입에 따라 다른 form 데이터를 가질 수 있습니다.\n\n' +
      '**예시 구조:**\n' +
      '```json\n' +
      '[\n' +
      '  {\n' +
      '    "title": "만족도를 선택해주세요",\n' +
      '    "type": "multiple_choice",\n' +
      '    "form": {\n' +
      '      "options": ["매우 만족", "만족", "보통", "불만족"]\n' +
      '    },\n' +
      '    "isRequired": true,\n' +
      '    "order": 0\n' +
      '  },\n' +
      '  {\n' +
      '    "title": "개선 의견을 작성해주세요",\n' +
      '    "type": "paragraph",\n' +
      '    "isRequired": false,\n' +
      '    "order": 1\n' +
      '  }\n' +
      ']\n' +
      '```',
    type: [SurveyQuestionDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionDto)
  questions?: SurveyQuestionDto[];
}
