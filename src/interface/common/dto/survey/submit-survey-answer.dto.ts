import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsDate,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

/**
 * 텍스트 응답 DTO (단답형, 장문형)
 *
 * 사용 질문 타입:
 * - `short_answer` (단답형)
 * - `paragraph` (장문형)
 */
export class TextAnswerDto {
  @ApiProperty({
    description: '질문 ID (UUID 형식)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description:
      '텍스트 응답 내용\n\n' +
      '**단답형**: 짧은 텍스트 (예: 이름, 부서명)\n' +
      '**장문형**: 긴 텍스트 (예: 의견, 제안사항)',
    example: '이것은 응답 내용입니다.',
  })
  @IsString()
  textValue: string;
}

/**
 * 선택형 응답 DTO (객관식, 드롭다운)
 *
 * 사용 질문 타입:
 * - `multiple_choice` (객관식 - 단일 선택)
 * - `dropdown` (드롭다운 - 단일 선택)
 */
export class ChoiceAnswerDto {
  @ApiProperty({
    description: '질문 ID (UUID 형식)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description:
      '선택한 옵션 (하나만 선택 가능)\n\n' +
      '⚠️ **주의**: 반드시 질문의 `form.options` 배열에 있는 값 중 하나를 선택해야 합니다.',
    example: '매우 만족',
  })
  @IsString()
  selectedOption: string;
}

/**
 * 체크박스 응답 DTO (다중 선택)
 *
 * 사용 질문 타입:
 * - `checkboxes` (체크박스 - 다중 선택 가능)
 */
export class CheckboxAnswerDto {
  @ApiProperty({
    description: '질문 ID (UUID 형식)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description:
      '선택한 옵션들 (여러 개 선택 가능)\n\n' +
      '⚠️ **주의**: 반드시 질문의 `form.options` 배열에 있는 값들 중에서 선택해야 합니다.',
    example: ['매우 만족', '만족'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  selectedOptions: string[];
}

/**
 * 척도 응답 DTO (선형 척도)
 *
 * 사용 질문 타입:
 * - `linear_scale` (선형 척도)
 */
export class ScaleAnswerDto {
  @ApiProperty({
    description: '질문 ID (UUID 형식)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description:
      '척도 값\n\n' +
      '⚠️ **주의**: 질문의 `form.minScale`과 `form.maxScale` 범위 내의 값이어야 합니다.\n' +
      '- 기본 범위: 1~10\n' +
      '- 예시: 1 (매우 불만족) ~ 10 (매우 만족)',
    example: 7,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  scaleValue: number;
}

/**
 * 그리드 응답 항목 DTO
 */
export class GridAnswerItemDto {
  @ApiProperty({
    description:
      '행 이름\n\n' +
      '⚠️ **주의**: 질문의 `form.rows` 배열에 있는 값 중 하나여야 합니다.',
    example: '서비스 품질',
  })
  @IsString()
  rowName: string;

  @ApiProperty({
    description:
      '열 값 (선택한 값)\n\n' +
      '⚠️ **주의**: 질문의 `form.columns` 배열에 있는 값 중 하나여야 합니다.',
    example: '매우 만족',
  })
  @IsString()
  columnValue: string;
}

/**
 * 그리드 응답 DTO (그리드 척도)
 *
 * 사용 질문 타입:
 * - `grid_scale` (그리드 척도 - 행-열 매트릭스)
 *
 * 예시:
 * - 행(rows): ['서비스 품질', '응답 속도', '친절도']
 * - 열(columns): ['매우 불만족', '불만족', '보통', '만족', '매우 만족']
 * - 각 행마다 하나의 열 값을 선택
 */
export class GridAnswerDto {
  @ApiProperty({
    description: '질문 ID (UUID 형식)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description:
      '그리드 응답 목록 (각 행마다 하나의 열 값 선택)\n\n' +
      '⚠️ **주의**: 질문의 `form.rows` 배열에 있는 모든 행에 대해 응답해야 합니다.',
    type: [GridAnswerItemDto],
    example: [
      {
        rowName: '서비스 품질',
        columnValue: '매우 만족',
      },
      {
        rowName: '응답 속도',
        columnValue: '만족',
      },
      {
        rowName: '친절도',
        columnValue: '매우 만족',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GridAnswerItemDto)
  @ArrayMinSize(1)
  gridAnswers: GridAnswerItemDto[];
}

/**
 * 파일 응답 항목 DTO
 */
export class FileAnswerItemDto {
  @ApiProperty({
    description: '파일 URL (AWS S3에 업로드된 파일의 URL)',
    example: 'https://s3.amazonaws.com/bucket/surveys/document.pdf',
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({
    description: '원본 파일명',
    example: 'document.pdf',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: '파일 크기 (bytes)',
    example: 1024000,
  })
  @IsNumber()
  fileSize: number;

  @ApiProperty({
    description:
      'MIME 타입\n\n' +
      '허용된 파일 형식은 질문의 `form.allowedFileTypes` 배열에 정의되어 있습니다.',
    example: 'application/pdf',
  })
  @IsString()
  mimeType: string;
}

/**
 * 파일 응답 DTO (파일 업로드)
 *
 * 사용 질문 타입:
 * - `file_upload` (파일 업로드)
 *
 * ⚠️ **주의**:
 * - 파일은 먼저 S3에 업로드한 후 URL을 전달해야 합니다.
 * - 질문의 `form.allowedFileTypes` 배열에 정의된 형식만 업로드 가능
 * - 질문의 `form.maxFileSize`를 초과하는 파일은 업로드 불가
 */
export class FileAnswerDto {
  @ApiProperty({
    description: '질문 ID (UUID 형식)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description:
      '파일 목록 (여러 파일 업로드 가능)\n\n' +
      '**프로세스**:\n' +
      '1. 파일을 S3에 업로드\n' +
      '2. S3 URL, 파일명, 크기, MIME 타입을 이 배열에 추가\n' +
      '3. 설문 응답 제출',
    type: [FileAnswerItemDto],
    example: [
      {
        fileUrl: 'https://s3.amazonaws.com/bucket/surveys/document.pdf',
        fileName: 'document.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAnswerItemDto)
  @ArrayMinSize(1)
  files: FileAnswerItemDto[];
}

/**
 * 날짜/시간 응답 DTO
 *
 * 사용 질문 타입:
 * - `datetime` (날짜/시간 선택)
 */
export class DatetimeAnswerDto {
  @ApiProperty({
    description: '질문 ID (UUID 형식)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description:
      '날짜/시간 값 (ISO 8601 형식)\n\n' +
      '**형식 예시**:\n' +
      '- 날짜와 시간: `2024-01-28T10:00:00Z` (UTC)\n' +
      '- 날짜와 시간: `2024-01-28T10:00:00+09:00` (KST)\n' +
      '- 날짜만: `2024-01-28T00:00:00Z`',
    example: '2024-01-28T10:00:00Z',
    type: String,
  })
  @IsString()
  datetimeValue: string;
}

/**
 * 설문 응답 제출 DTO
 *
 * 공지사항에 연결된 설문조사의 응답을 제출합니다.
 * 질문 타입에 따라 해당하는 배열에 응답을 추가해야 합니다.
 *
 * **질문 타입별 매핑**:
 * - `short_answer`, `paragraph` → `textAnswers`
 * - `multiple_choice`, `dropdown` → `choiceAnswers`
 * - `checkboxes` → `checkboxAnswers`
 * - `linear_scale` → `scaleAnswers`
 * - `grid_scale` → `gridAnswers`
 * - `file_upload` → `fileAnswers`
 * - `datetime` → `datetimeAnswers`
 *
 * **사용 예시**:
 * ```json
 * {
 *   "textAnswers": [
 *     {
 *       "questionId": "질문1-UUID",
 *       "textValue": "응답 내용"
 *     }
 *   ],
 *   "choiceAnswers": [
 *     {
 *       "questionId": "질문2-UUID",
 *       "selectedOption": "매우 만족"
 *     }
 *   ]
 * }
 * ```
 */
export class SubmitSurveyAnswerDto {
  @ApiProperty({
    description:
      '텍스트 응답 목록\n\n' +
      '**사용 질문 타입**: `short_answer` (단답형), `paragraph` (장문형)',
    type: [TextAnswerDto],
    required: false,
    example: [
      {
        questionId: '123e4567-e89b-12d3-a456-426614174001',
        textValue: '홍길동',
      },
      {
        questionId: '123e4567-e89b-12d3-a456-426614174002',
        textValue:
          '제품 품질 개선을 위한 제안사항입니다. 현재 사용 중인 제품에서...',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TextAnswerDto)
  textAnswers?: TextAnswerDto[];

  @ApiProperty({
    description:
      '선택형 응답 목록\n\n' +
      '**사용 질문 타입**: `multiple_choice` (객관식), `dropdown` (드롭다운)',
    type: [ChoiceAnswerDto],
    required: false,
    example: [
      {
        questionId: '123e4567-e89b-12d3-a456-426614174003',
        selectedOption: '매우 만족',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChoiceAnswerDto)
  choiceAnswers?: ChoiceAnswerDto[];

  @ApiProperty({
    description:
      '체크박스 응답 목록\n\n' +
      '**사용 질문 타입**: `checkboxes` (체크박스 - 다중 선택)',
    type: [CheckboxAnswerDto],
    required: false,
    example: [
      {
        questionId: '123e4567-e89b-12d3-a456-426614174004',
        selectedOptions: ['가격', '품질', '디자인'],
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckboxAnswerDto)
  checkboxAnswers?: CheckboxAnswerDto[];

  @ApiProperty({
    description:
      '척도 응답 목록\n\n' + '**사용 질문 타입**: `linear_scale` (선형 척도)',
    type: [ScaleAnswerDto],
    required: false,
    example: [
      {
        questionId: '123e4567-e89b-12d3-a456-426614174005',
        scaleValue: 8,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScaleAnswerDto)
  scaleAnswers?: ScaleAnswerDto[];

  @ApiProperty({
    description:
      '그리드 응답 목록\n\n' + '**사용 질문 타입**: `grid_scale` (그리드 척도)',
    type: [GridAnswerDto],
    required: false,
    example: [
      {
        questionId: '123e4567-e89b-12d3-a456-426614174006',
        gridAnswers: [
          {
            rowName: '서비스 품질',
            columnValue: '매우 만족',
          },
          {
            rowName: '응답 속도',
            columnValue: '만족',
          },
        ],
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GridAnswerDto)
  gridAnswers?: GridAnswerDto[];

  @ApiProperty({
    description:
      '파일 응답 목록\n\n' +
      '**사용 질문 타입**: `file_upload` (파일 업로드)\n\n' +
      '⚠️ **주의**: 파일은 먼저 S3에 업로드한 후 URL을 전달해야 합니다.',
    type: [FileAnswerDto],
    required: false,
    example: [
      {
        questionId: '123e4567-e89b-12d3-a456-426614174007',
        files: [
          {
            fileUrl: 'https://s3.amazonaws.com/bucket/surveys/document.pdf',
            fileName: 'document.pdf',
            fileSize: 1024000,
            mimeType: 'application/pdf',
          },
        ],
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAnswerDto)
  fileAnswers?: FileAnswerDto[];

  @ApiProperty({
    description:
      '날짜/시간 응답 목록\n\n' +
      '**사용 질문 타입**: `datetime` (날짜/시간 선택)',
    type: [DatetimeAnswerDto],
    required: false,
    example: [
      {
        questionId: '123e4567-e89b-12d3-a456-426614174008',
        datetimeValue: '2024-01-28T10:00:00Z',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DatetimeAnswerDto)
  datetimeAnswers?: DatetimeAnswerDto[];
}
