import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { ContentStatus } from '../content-status.types';
import { VoteResult } from './vote-result.entity';
import { ShareholdersMeetingTranslation } from './shareholders-meeting-translation.entity';

/**
 * ShareholdersMeeting Entity (주주총회)
 *
 * 주주총회 정보 및 의결 결과 관리
 * 다국어 지원: ShareholdersMeetingTranslation
 */
@Entity('shareholders_meetings')
@Index('idx_shareholders_meeting_status', ['status'])
@Index('idx_shareholders_meeting_is_public', ['isPublic'])
@Index('idx_shareholders_meeting_date', ['meetingDate'])
@Index('idx_shareholders_meeting_order', ['order'])
export class ShareholdersMeeting extends BaseEntity<ShareholdersMeeting> {
  @Column({
    type: 'boolean',
    default: true,
    comment: '공개 여부',
  })
  isPublic: boolean;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
    comment: '상태 (draft|approved|under_review|rejected|opened)',
  })
  status: ContentStatus;

  @Column({
    type: 'varchar',
    length: 500,
    comment: '주주총회 장소',
  })
  location: string;

  @Column({
    type: 'timestamp',
    comment: '주주총회 일시',
  })
  meetingDate: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '공개 일시',
  })
  releasedAt: Date | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: '대표 이미지 URL (AWS S3)',
  })
  imageUrl: string | null;

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

  @OneToMany(() => VoteResult, (voteResult) => voteResult.shareholdersMeeting, {
    cascade: true,
  })
  voteResults: VoteResult[];

  @OneToMany(
    () => ShareholdersMeetingTranslation,
    (translation) => translation.shareholdersMeeting,
    { cascade: true },
  )
  translations: ShareholdersMeetingTranslation[];

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): ShareholdersMeeting {
    return this;
  }
}
