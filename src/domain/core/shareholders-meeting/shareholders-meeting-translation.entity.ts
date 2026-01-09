import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@libs/base/base.entity';
import { ShareholdersMeeting } from './shareholders-meeting.entity';
import { Language } from '../../common/language/language.entity';

/**
 * ShareholdersMeetingTranslation Entity (주주총회 번역)
 * 
 * 주주총회의 언어별 콘텐츠
 */
@Entity('shareholders_meeting_translations')
@Index('uk_shareholders_meeting_translation', ['shareholdersMeetingId', 'languageId'], {
  unique: true,
})
export class ShareholdersMeetingTranslation extends BaseEntity<ShareholdersMeetingTranslation> {
  @Column({
    type: 'uuid',
    comment: '주주총회 ID',
  })
  shareholdersMeetingId: string;

  @ManyToOne(
    () => ShareholdersMeeting,
    (meeting) => meeting.translations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'shareholdersMeetingId' })
  shareholdersMeeting: ShareholdersMeeting;

  @Column({
    type: 'uuid',
    comment: '언어 ID',
  })
  languageId: string;

  @ManyToOne(() => Language)
  @JoinColumn({ name: 'languageId' })
  language: Language;

  @Column({
    type: 'varchar',
    length: 500,
    comment: '제목',
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '간단한 설명',
  })
  description: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: '상세 내용',
  })
  content: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: '의결 결과 텍스트',
  })
  resultText: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: '요약',
  })
  summary: string | null;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): ShareholdersMeetingTranslation {
    return this;
  }
}
