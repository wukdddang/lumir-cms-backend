import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@libs/base/base.entity';
import { MainPopup } from './main-popup.entity';
import { Language } from '../../common/language/language.entity';

/**
 * MainPopupTranslation Entity (메인 팝업 번역)
 * 
 * 메인 팝업의 언어별 콘텐츠
 */
@Entity('main_popup_translations')
@Index('uk_main_popup_translation', ['mainPopupId', 'languageId'], {
  unique: true,
})
export class MainPopupTranslation extends BaseEntity<MainPopupTranslation> {
  @Column({
    type: 'uuid',
    comment: '메인 팝업 ID',
  })
  mainPopupId: string;

  @ManyToOne(() => MainPopup, (popup) => popup.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mainPopupId' })
  mainPopup: MainPopup;

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
    comment: '설명',
  })
  description: string | null;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): MainPopupTranslation {
    return this;
  }
}
