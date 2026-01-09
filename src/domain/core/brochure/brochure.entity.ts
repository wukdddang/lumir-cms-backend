import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '@libs/base/base.entity';
import { ContentStatus } from '../content-status.types';
import { BrochureTranslation } from './brochure-translation.entity';

/**
 * Brochure Entity (브로슈어)
 * 
 * 회사 소개 및 제품 브로슈어 관리
 * 다국어 지원: BrochureTranslation
 */
@Entity('brochures')
@Index('idx_brochure_status', ['status'])
@Index('idx_brochure_is_public', ['isPublic'])
@Index('idx_brochure_order', ['order'])
export class Brochure extends BaseEntity<Brochure> {
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
    type: 'jsonb',
    nullable: true,
    comment: '첨부파일 목록 (AWS S3 URLs) - 파일명으로 언어 구분 (예: brochure_ko.pdf)',
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

  @OneToMany(() => BrochureTranslation, (translation) => translation.brochure, {
    cascade: true,
  })
  translations: BrochureTranslation[];

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): Brochure {
    return this;
  }
}
