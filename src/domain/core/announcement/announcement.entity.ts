import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '@libs/base/base.entity';
import { ContentStatus } from '../content-status.types';
import { AnnouncementRead } from './announcement-read.entity';

/**
 * Announcement Entity (공지사항)
 * 
 * 내부 공지사항 관리
 * 다국어 지원: 없음
 * Lazy Creation 패턴: AnnouncementRead
 */
@Entity('announcements')
@Index('idx_announcement_status', ['status'])
@Index('idx_announcement_is_public', ['isPublic'])
@Index('idx_announcement_is_fixed', ['isFixed'])
@Index('idx_announcement_must_read', ['mustRead'])
@Index('idx_announcement_released_at', ['releasedAt'])
@Index('idx_announcement_expired_at', ['expiredAt'])
@Index('idx_announcement_order', ['order'])
export class Announcement extends BaseEntity<Announcement> {
  @Column({
    type: 'varchar',
    length: 500,
    comment: '제목',
  })
  title: string;

  @Column({
    type: 'text',
    comment: '내용',
  })
  content: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: '상단 고정 여부',
  })
  isFixed: boolean;

  @Column({
    type: 'boolean',
    default: true,
    comment: '공개 여부 (true=전사공개, false=제한공개)',
  })
  isPublic: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '공개 시작 일시',
  })
  releasedAt: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '공개 종료 일시',
  })
  expiredAt: Date | null;

  @Column({
    type: 'boolean',
    default: false,
    comment: '필독 여부',
  })
  mustRead: boolean;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
    comment: '상태 (draft|approved|under_review|rejected|opened)',
  })
  status: ContentStatus;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '특정 직원 ID 목록 (외부 시스템 직원 ID - SSO)',
  })
  permissionEmployeeIds: string[] | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '직급 코드 목록',
  })
  permissionRankCodes: string[] | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '직책 코드 목록',
  })
  permissionPositionCodes: string[] | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '부서 코드 목록',
  })
  permissionDepartmentCodes: string[] | null;

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

  @OneToMany(() => AnnouncementRead, (read) => read.announcement)
  reads: AnnouncementRead[];

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): Announcement {
    return this;
  }
}
