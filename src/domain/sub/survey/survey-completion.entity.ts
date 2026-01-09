import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { Survey } from './survey.entity';

/**
 * SurveyCompletion Entity (설문 완료 추적)
 *
 * 직원별 설문 완료 여부 관리
 * 완료 여부는 totalQuestions === answeredQuestions로 계산
 */
@Entity('survey_completions')
@Index('uk_survey_completion', ['surveyId', 'employeeId'], { unique: true })
@Index('idx_survey_completion_employee_id', ['employeeId'])
export class SurveyCompletion extends BaseEntity<SurveyCompletion> {
  @Column({
    type: 'uuid',
    comment: '설문조사 ID',
  })
  surveyId: string;

  @ManyToOne(() => Survey, (survey) => survey.completions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  @Column({
    type: 'uuid',
    comment: '직원 ID (외부 시스템 직원 ID - SSO)',
  })
  employeeId: string;

  @Column({
    type: 'int',
    comment: '전체 질문 수',
  })
  totalQuestions: number;

  @Column({
    type: 'int',
    default: 0,
    comment: '응답한 질문 수',
  })
  answeredQuestions: number;

  @Column({
    type: 'boolean',
    comment: '완료 여부 (generated: totalQuestions === answeredQuestions)',
  })
  isCompleted: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '완료 일시',
  })
  completedAt: Date | null;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): SurveyCompletion {
    return this;
  }
}
