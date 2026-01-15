import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AnnouncementPermissionAction } from './announcement-permission-action.types';
import { Announcement } from './announcement.entity';

/**
 * AnnouncementPermissionLog Entity (공지사항 권한 로그)
 * 
 * Announcement 권한 무효화 추적
 * - 외부 시스템(SSO)의 부서/직급/직책/직원 코드 제거/변경 시 이력 기록
 * - 감사 로그 및 문제 해결 히스토리
 * 
 * ⚠️ Soft Delete 없음: 로그는 영구 보관
 */
@Entity('announcement_permission_logs')
@Index('idx_announcement_permission_log_announcement_id', ['announcementId'])
@Index('idx_announcement_permission_log_action', ['action'])
@Index('idx_announcement_permission_log_detected_at', ['detectedAt'])
@Index('idx_announcement_permission_log_resolved_at', ['resolvedAt'])
export class AnnouncementPermissionLog {
  @PrimaryGeneratedColumn('uuid', {
    comment: '공지사항 권한 로그 ID',
  })
  id: string;

  @Column({
    type: 'uuid',
    comment: '공지사항 ID',
  })
  announcementId: string;

  @ManyToOne(() => Announcement, (announcement) => announcement.permissionLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'announcementId' })
  announcement: Announcement;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '무효화된 부서 정보 (ID와 이름)',
  })
  invalidDepartments: Array<{
    id: string;
    name: string | null;
  }> | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '무효화된 직급 코드 목록',
  })
  invalidRankCodes: string[] | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '무효화된 직책 코드 목록',
  })
  invalidPositionCodes: string[] | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '무효화된 직원 정보 (ID와 이름)',
  })
  invalidEmployees: Array<{
    id: string;
    name: string | null;
  }> | null;

  @Column({
    type: 'jsonb',
    comment: '권한 설정 스냅샷 (변경 전) - 부서와 직원은 ID와 이름 포함',
  })
  snapshotPermissions: {
    permissionRankCodes: string[] | null;
    permissionPositionCodes: string[] | null;
    permissionDepartments: Array<{
      id: string;
      name: string | null;
    }> | null;
    permissionEmployees: Array<{
      id: string;
      name: string | null;
    }> | null;
  };

  @Column({
    type: 'enum',
    enum: AnnouncementPermissionAction,
    comment: '처리 상태 (detected|removed|notified|resolved)',
  })
  action: AnnouncementPermissionAction;

  @Column({
    type: 'text',
    nullable: true,
    comment: '추가 메모',
  })
  note: string | null;

  @Column({
    type: 'timestamp',
    comment: '감지 일시',
  })
  detectedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '해결 일시',
  })
  resolvedAt: Date | null;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '해결한 관리자 ID (외부 시스템 직원 ID - SSO)',
  })
  resolvedBy: string | null;

  @CreateDateColumn({
    type: 'timestamp',
    comment: '생성 일시',
  })
  createdAt: Date;

  // ⚠️ updatedAt, deletedAt, version 없음 (로그는 수정/삭제 불가, 영구 보관)
}
