import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';

/**
 * SurveyResponseGrid Entity (설문 응답 - 그리드)
 * 
 * 그리드 척도 응답 (행-열 매트릭스)
 */
@Entity('survey_response_grids')
@Index('uk_survey_response_grid', ['questionId', 'employeeId', 'rowName'], {
  unique: true,
})
@Index('idx_survey_response_grid_employee_id', ['employeeId'])
export class SurveyResponseGrid extends BaseEntity<SurveyResponseGrid> {
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
    comment: '행 이름',
  })
  rowName: string;

  @Column({
    type: 'varchar',
    length: 500,
    comment: '열 값 (선택한 값)',
  })
  columnValue: string;

  @Column({
    type: 'timestamp',
    comment: '제출 일시',
  })
  submittedAt: Date;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): SurveyResponseGrid {
    return this;
  }
}
