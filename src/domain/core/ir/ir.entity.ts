import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IRTranslation } from './ir-translation.entity';

/**
 * IR Entity (투자자 정보)
 *
 * IR 자료 및 투자자 정보 관리
 * 다국어 지원: IRTranslation
 */
@Entity('irs')
@Index('idx_ir_is_public', ['isPublic'])
@Index('idx_ir_order', ['order'])
export class IR extends BaseEntity<IR> {
  @Column({
    type: 'boolean',
    default: true,
    comment: '공개 여부',
  })
  isPublic: boolean;

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

  @Column({
    type: 'uuid',
    comment: 'IR 카테고리 ID',
  })
  categoryId: string;

  @OneToMany(() => IRTranslation, (translation) => translation.ir, {
    cascade: true,
  })
  translations: IRTranslation[];

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): IR {
    return this;
  }
}
