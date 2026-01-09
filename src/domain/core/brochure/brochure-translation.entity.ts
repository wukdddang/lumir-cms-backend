import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { Brochure } from './brochure.entity';
import { Language } from '../../common/language/language.entity';

/**
 * BrochureTranslation Entity (브로슈어 번역)
 *
 * 브로슈어의 언어별 콘텐츠
 */
@Entity('brochure_translations')
@Index('uk_brochure_translation', ['brochureId', 'languageId'], {
  unique: true,
})
export class BrochureTranslation extends BaseEntity<BrochureTranslation> {
  @Column({
    type: 'uuid',
    comment: '브로슈어 ID',
  })
  brochureId: string;

  @ManyToOne(() => Brochure, (brochure) => brochure.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brochureId' })
  brochure: Brochure;

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
  DTO로_변환한다(): BrochureTranslation {
    return this;
  }
}
