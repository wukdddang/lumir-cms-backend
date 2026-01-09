import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';

/**
 * SurveyResponseScale Entity (설문 응답 - 척도)
 * 
 * 선형 척도 응답 (1-10)
 */
@Entity('survey_response_scales')
@Index('uk_survey_response_scale', ['questionId', 'employeeId'], {
  unique: true,
})
@Index('idx_survey_response_scale_employee_id', ['employeeId'])
export class SurveyResponseScale extends BaseEntity<SurveyResponseScale> {
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
    type: 'int',
    comment: '척도 값 (1-10)',
  })
  scaleValue: number;

  @Column({
    type: 'timestamp',
    comment: '제출 일시',
  })
  submittedAt: Date;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): SurveyResponseScale {
    return this;
  }
}
