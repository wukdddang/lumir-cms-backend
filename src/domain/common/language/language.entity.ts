import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';

/**
 * Language Entity (언어)
 *
 * 다국어 지원을 위한 언어 정보 관리
 * ISO 639-1 표준 언어 코드 지원
 */
@Entity('languages')
@Index('idx_language_code', ['code'])
@Index('idx_language_is_active', ['isActive'])
export class Language extends BaseEntity<Language> {
  @Column({
    type: 'varchar',
    length: 10,
    unique: true,
    comment: '언어 코드 (ISO 639-1 표준: ko, en, ja, zh 등)',
  })
  code: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '언어 이름 (예: 한국어, English)',
  })
  name: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: '활성화 여부',
  })
  isActive: boolean;

  @Column({
    type: 'int',
    default: 0,
    comment: '정렬 순서',
  })
  order: number;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): Language {
    return this;
  }
}
