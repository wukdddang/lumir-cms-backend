import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { ContentStatus } from '../content-status.types';
import { ElectronicDisclosureTranslation } from './electronic-disclosure-translation.entity';

/**
 * ElectronicDisclosure Entity (전자공시)
 *
 * 법적 전자공시 문서 관리
 * 다국어 지원: ElectronicDisclosureTranslation
 */
@Entity('electronic_disclosures')
@Index('idx_electronic_disclosure_status', ['status'])
@Index('idx_electronic_disclosure_is_public', ['isPublic'])
@Index('idx_electronic_disclosure_order', ['order'])
export class ElectronicDisclosure extends BaseEntity<ElectronicDisclosure> {
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
    type: 'int',
    default: 0,
    comment: '정렬 순서',
  })
  order: number;

  @OneToMany(
    () => ElectronicDisclosureTranslation,
    (translation) => translation.electronicDisclosure,
    { cascade: true },
  )
  translations: ElectronicDisclosureTranslation[];

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): ElectronicDisclosure {
    return this;
  }
}
