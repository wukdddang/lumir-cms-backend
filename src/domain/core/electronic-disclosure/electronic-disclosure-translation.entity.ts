import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { ElectronicDisclosure } from './electronic-disclosure.entity';
import { Language } from '../../common/language/language.entity';

/**
 * ElectronicDisclosureTranslation Entity (전자공시 번역)
 * 
 * 전자공시의 언어별 콘텐츠
 */
@Entity('electronic_disclosure_translations')
@Index('uk_electronic_disclosure_translation', ['electronicDisclosureId', 'languageId'], {
  unique: true,
})
export class ElectronicDisclosureTranslation extends BaseEntity<ElectronicDisclosureTranslation> {
  @Column({
    type: 'uuid',
    comment: '전자공시 ID',
  })
  electronicDisclosureId: string;

  @ManyToOne(
    () => ElectronicDisclosure,
    (disclosure) => disclosure.translations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'electronicDisclosureId' })
  electronicDisclosure: ElectronicDisclosure;

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

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): ElectronicDisclosureTranslation {
    return this;
  }
}
