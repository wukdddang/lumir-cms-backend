import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';

/**
 * SurveyResponseFile Entity (설문 응답 - 파일)
 * 
 * 파일 업로드 응답
 */
@Entity('survey_response_files')
@Index('uk_survey_response_file', ['questionId', 'employeeId', 'fileUrl'], {
  unique: true,
})
@Index('idx_survey_response_file_employee_id', ['employeeId'])
export class SurveyResponseFile extends BaseEntity<SurveyResponseFile> {
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
    comment: '파일 URL (AWS S3)',
  })
  fileUrl: string;

  @Column({
    type: 'varchar',
    length: 500,
    comment: '원본 파일명',
  })
  fileName: string;

  @Column({
    type: 'bigint',
    comment: '파일 크기 (bytes)',
  })
  fileSize: number;

  @Column({
    type: 'varchar',
    length: 200,
    comment: 'MIME 타입',
  })
  mimeType: string;

  @Column({
    type: 'timestamp',
    comment: '제출 일시',
  })
  submittedAt: Date;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): SurveyResponseFile {
    return this;
  }
}
