import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { Announcement } from './announcement.entity';

/**
 * AnnouncementRead Entity (공지사항 읽음 표시)
 *
 * Lazy Creation 패턴: 직원이 읽을 때만 레코드 생성
 * 직원별 공지사항 읽음 여부 추적
 */
@Entity('announcement_reads')
@Index('uk_announcement_read', ['announcementId', 'employeeId'], {
  unique: true,
})
@Index('idx_announcement_read_employee_id', ['employeeId'])
export class AnnouncementRead extends BaseEntity<AnnouncementRead> {
  @Column({
    type: 'uuid',
    comment: '공지사항 ID',
  })
  announcementId: string;

  @ManyToOne(() => Announcement, (announcement) => announcement.reads, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'announcementId' })
  announcement: Announcement;

  @Column({
    type: 'uuid',
    comment: '직원 ID (외부 시스템 직원 ID - SSO)',
  })
  employeeId: string;

  @Column({
    type: 'timestamp',
    comment: '읽은 일시',
  })
  readAt: Date;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): AnnouncementRead {
    return this;
  }
}
