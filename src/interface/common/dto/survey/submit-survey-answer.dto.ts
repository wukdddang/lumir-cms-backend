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
 */
export class TextAnswerDto {
  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: '텍스트 응답',
    example: '이것은 응답 내용입니다.',
  })
  @IsString()
  textValue: string;
}

/**
 * 선택형 응답 DTO (객관식, 드롭다운)
 */
export class ChoiceAnswerDto {
  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: '선택한 옵션',
    example: '옵션 1',
  })
  @IsString()
  selectedOption: string;
}

/**
 * 체크박스 응답 DTO (다중 선택)
 */
export class CheckboxAnswerDto {
  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: '선택한 옵션들',
    example: ['옵션 1', '옵션 2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  selectedOptions: string[];
}

/**
 * 척도 응답 DTO (선형 척도)
 */
export class ScaleAnswerDto {
  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: '척도 값 (1-10)',
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
    description: '행 이름',
    example: '질문 1',
  })
  @IsString()
  rowName: string;

  @ApiProperty({
    description: '열 값 (선택한 값)',
    example: '매우 만족',
  })
  @IsString()
  columnValue: string;
}

/**
 * 그리드 응답 DTO (그리드 척도)
 */
export class GridAnswerDto {
  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: '그리드 응답 목록',
    type: [GridAnswerItemDto],
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
    description: '파일 URL (AWS S3)',
    example: 'https://s3.amazonaws.com/bucket/file.pdf',
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
    description: 'MIME 타입',
    example: 'application/pdf',
  })
  @IsString()
  mimeType: string;
}

/**
 * 파일 응답 DTO (파일 업로드)
 */
export class FileAnswerDto {
  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: '파일 목록',
    type: [FileAnswerItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAnswerItemDto)
  @ArrayMinSize(1)
  files: FileAnswerItemDto[];
}

/**
 * 날짜/시간 응답 DTO
 */
export class DatetimeAnswerDto {
  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: '날짜/시간 값',
    example: '2024-01-28T10:00:00Z',
    type: String,
  })
  @IsString()
  datetimeValue: string;
}

/**
 * 설문 응답 제출 DTO
 */
export class SubmitSurveyAnswerDto {
  @ApiProperty({
    description: '텍스트 응답 목록 (단답형, 장문형)',
    type: [TextAnswerDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TextAnswerDto)
  textAnswers?: TextAnswerDto[];

  @ApiProperty({
    description: '선택형 응답 목록 (객관식, 드롭다운)',
    type: [ChoiceAnswerDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChoiceAnswerDto)
  choiceAnswers?: ChoiceAnswerDto[];

  @ApiProperty({
    description: '체크박스 응답 목록 (다중 선택)',
    type: [CheckboxAnswerDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckboxAnswerDto)
  checkboxAnswers?: CheckboxAnswerDto[];

  @ApiProperty({
    description: '척도 응답 목록 (선형 척도)',
    type: [ScaleAnswerDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScaleAnswerDto)
  scaleAnswers?: ScaleAnswerDto[];

  @ApiProperty({
    description: '그리드 응답 목록 (그리드 척도)',
    type: [GridAnswerDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GridAnswerDto)
  gridAnswers?: GridAnswerDto[];

  @ApiProperty({
    description: '파일 응답 목록 (파일 업로드)',
    type: [FileAnswerDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAnswerDto)
  fileAnswers?: FileAnswerDto[];

  @ApiProperty({
    description: '날짜/시간 응답 목록',
    type: [DatetimeAnswerDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DatetimeAnswerDto)
  datetimeAnswers?: DatetimeAnswerDto[];
}
