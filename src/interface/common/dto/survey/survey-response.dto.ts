import { ApiProperty } from '@nestjs/swagger';
import { Survey } from '@domain/sub/survey/survey.entity';
import { SurveyQuestion } from '@domain/sub/survey/survey-question.entity';
import { InqueryType } from '@domain/sub/survey/inquery-type.types';

/**
 * 설문 질문 응답 DTO
 */
export class SurveyQuestionResponseDto {
  @ApiProperty({ description: '질문 ID' })
  id: string;

  @ApiProperty({ description: '질문 제목' })
  title: string;

  @ApiProperty({
    description:
      '질문 타입\n\n' +
      '사용 가능한 타입:\n' +
      '- `short_answer`: 단답형 (짧은 텍스트 입력)\n' +
      '- `paragraph`: 장문형 (긴 텍스트 입력)\n' +
      '- `multiple_choice`: 객관식 (단일 선택)\n' +
      '- `dropdown`: 드롭다운 (단일 선택)\n' +
      '- `checkboxes`: 체크박스 (다중 선택)\n' +
      '- `file_upload`: 파일 업로드\n' +
      '- `datetime`: 날짜/시간 선택\n' +
      '- `linear_scale`: 선형 척도 (1-10)\n' +
      '- `grid_scale`: 그리드 척도',
    enum: InqueryType,
  })
  type: InqueryType;

  @ApiProperty({ description: '질문 폼 데이터', required: false })
  form?: any;

  @ApiProperty({ description: '필수 응답 여부' })
  isRequired: boolean;

  @ApiProperty({ description: '질문 정렬 순서' })
  order: number;
}

/**
 * 설문조사 응답 DTO
 */
export class SurveyResponseDto {
  @ApiProperty({ description: '설문조사 ID' })
  id: string;

  @ApiProperty({ description: '공지사항 ID' })
  announcementId: string;

  @ApiProperty({ description: '설문조사 제목' })
  title: string;

  @ApiProperty({ description: '설문조사 설명', required: false })
  description: string | null;

  @ApiProperty({ description: '설문 시작 일시', required: false })
  startDate: Date | null;

  @ApiProperty({ description: '설문 마감 일시', required: false })
  endDate: Date | null;

  @ApiProperty({ description: '정렬 순서' })
  order: number;

  @ApiProperty({
    description: '설문 질문 목록',
    type: [SurveyQuestionResponseDto],
  })
  questions: SurveyQuestionResponseDto[];

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;

  static from(survey: Survey): SurveyResponseDto {
    return {
      id: survey.id,
      announcementId: survey.announcementId,
      title: survey.title,
      description: survey.description,
      startDate: survey.startDate,
      endDate: survey.endDate,
      order: survey.order,
      questions: survey.questions
        ? survey.questions.map((q) => ({
            id: q.id,
            title: q.title,
            type: q.type,
            form: q.form,
            isRequired: q.isRequired,
            order: q.order,
          }))
        : [],
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
    };
  }
}

/**
 * 설문조사 목록 응답 DTO
 */
export class SurveyListResponseDto {
  @ApiProperty({ description: '설문조사 목록', type: [SurveyResponseDto] })
  items: SurveyResponseDto[];

  @ApiProperty({ description: '전체 개수' })
  total: number;

  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지당 개수' })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;
}

/**
 * 설문 완료 DTO
 */
export class CompleteSurveyDto {
  @ApiProperty({ description: '직원 ID', required: false })
  employeeId?: string;
}
