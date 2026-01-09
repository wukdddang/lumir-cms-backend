import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/base/base.entity';

/**
 * SurveyResponseText Entity (설문 응답 - 텍스트)
 * 
 * 단답형, 장문형 응답
 */
@Entity('survey_response_texts')
@Index('uk_survey_response_text', ['questionId', 'employeeId'], {
  unique: true,
})
@Index('idx_survey_response_text_employee_id', ['employeeId'])
export class SurveyResponseText extends BaseEntity<SurveyResponseText> {
  @Column({
    type: 'uuid',
    comment: '질문 ID',
  })
  questionId: string;

  @Column({
    type: 'uuid',
    comment: '직원 ID (외부 시스템 직원 ID - SSO)',
  })
  employeeId: string;

  @Column({
    type: 'text',
    comment: '텍스트 응답',
  })
  textValue: string;

  @Column({
    type: 'timestamp',
    comment: '제출 일시',
  })
  submittedAt: Date;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): SurveyResponseText {
    return this;
  }
}
