import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '@libs/base/base.entity';
import { EducationStatus } from './education-status.types';
import { Attendee } from './attendee.entity';

/**
 * EducationManagement Entity (교육 관리)
 * 
 * 직원 교육 및 수강 관리
 * 다국어 지원: 없음
 */
@Entity('education_managements')
@Index('idx_education_management_status', ['status'])
@Index('idx_education_management_is_public', ['isPublic'])
@Index('idx_education_management_manager_id', ['managerId'])
@Index('idx_education_management_deadline', ['deadline'])
@Index('idx_education_management_order', ['order'])
export class EducationManagement extends BaseEntity<EducationManagement> {
  @Column({
    type: 'varchar',
    length: 500,
    comment: '교육 제목',
  })
  title: string;

  @Column({
    type: 'text',
    comment: '교육 내용',
  })
  content: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: '공개 여부',
  })
  isPublic: boolean;

  @Column({
    type: 'enum',
    enum: EducationStatus,
    default: EducationStatus.SCHEDULED,
    comment: '상태 (scheduled|in_progress|completed|cancelled|postponed)',
  })
  status: EducationStatus;

  @Column({
    type: 'uuid',
    comment: '담당자 ID (외부 시스템 직원 ID - SSO)',
  })
  managerId: string;

  @Column({
    type: 'timestamp',
    comment: '교육 마감 일시',
  })
  deadline: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '첨부파일 목록 (AWS S3 URLs)',
  })
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }> | null;

  @Column({
    type: 'int',
    default: 0,
    comment: '정렬 순서',
  })
  order: number;

  @OneToMany(() => Attendee, (attendee) => attendee.educationManagement)
  attendees: Attendee[];

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): EducationManagement {
    return this;
  }
}
