import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IR } from './ir.entity';
import { Language } from '../../common/language/language.entity';

/**
 * IRTranslation Entity (IR 번역)
 * 
 * IR의 언어별 콘텐츠
 */
@Entity('ir_translations')
@Index('uk_ir_translation', ['irId', 'languageId'], {
  unique: true,
})
export class IRTranslation extends BaseEntity<IRTranslation> {
  @Column({
    type: 'uuid',
    comment: 'IR ID',
  })
  irId: string;

  @ManyToOne(() => IR, (ir) => ir.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'irId' })
  ir: IR;

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
    type: 'boolean',
    default: true,
    comment: '동기화 여부 (true: 원본과 동기화, false: 개별 수정됨)',
  })
  isSynced: boolean;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): IRTranslation {
    return this;
  }
}
