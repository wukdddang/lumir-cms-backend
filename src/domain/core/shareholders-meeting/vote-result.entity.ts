import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@libs/base/base.entity';
import { VoteResultType } from './vote-result-type.types';
import { ShareholdersMeeting } from './shareholders-meeting.entity';
import { VoteResultTranslation } from './vote-result-translation.entity';

/**
 * VoteResult Entity (의결 결과)
 * 
 * 주주총회 안건별 의결 결과
 * 다국어 지원: VoteResultTranslation
 */
@Entity('vote_results')
@Index('idx_vote_result_shareholders_meeting_id', ['shareholdersMeetingId'])
@Index('idx_vote_result_agenda_number', ['agendaNumber'])
export class VoteResult extends BaseEntity<VoteResult> {
  @Column({
    type: 'uuid',
    comment: '주주총회 ID',
  })
  shareholdersMeetingId: string;

  @ManyToOne(
    () => ShareholdersMeeting,
    (meeting) => meeting.voteResults,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'shareholdersMeetingId' })
  shareholdersMeeting: ShareholdersMeeting;

  @Column({
    type: 'int',
    comment: '안건 번호 (정렬 순서로도 사용)',
  })
  agendaNumber: number;

  @Column({
    type: 'int',
    comment: '전체 투표 수',
  })
  totalVote: number;

  @Column({
    type: 'int',
    comment: '찬성 투표 수',
  })
  yesVote: number;

  @Column({
    type: 'int',
    comment: '반대 투표 수',
  })
  noVote: number;

  @Column({
    type: 'float',
    comment: '찬성률 (%)',
  })
  approvalRating: number;

  @Column({
    type: 'enum',
    enum: VoteResultType,
    comment: '의결 결과 (accepted|rejected)',
  })
  result: VoteResultType;

  @OneToMany(
    () => VoteResultTranslation,
    (translation) => translation.voteResult,
    { cascade: true },
  )
  translations: VoteResultTranslation[];

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): VoteResult {
    return this;
  }
}
