import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/base/base.entity';

/**
 * SurveyResponseChoice Entity (설문 응답 - 선택형)
 * 
 * 객관식, 드롭다운 응답 (단일 선택)
 */
@Entity('survey_response_choices')
@Index('uk_survey_response_choice', ['questionId', 'employeeId'], {
  unique: true,
})
@Index('idx_survey_response_choice_employee_id', ['employeeId'])
export class SurveyResponseChoice extends BaseEntity<SurveyResponseChoice> {
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
    type: 'varchar',
    length: 500,
    comment: '선택한 옵션',
  })
  selectedOption: string;

  @Column({
    type: 'timestamp',
    comment: '제출 일시',
  })
  submittedAt: Date;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): SurveyResponseChoice {
    return this;
  }
}
