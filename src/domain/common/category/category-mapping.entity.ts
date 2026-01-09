import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { Category } from './category.entity';

/**
 * CategoryMapping Entity (카테고리 매핑)
 *
 * 엔티티와 카테고리 간 다대다 관계 관리
 * 정규화된 구조로 유연한 카테고리 할당
 */
@Entity('category_mappings')
@Index('idx_category_mapping_entity_id', ['entityId'])
@Index('idx_category_mapping_category_id', ['categoryId'])
@Index('uk_category_mapping_entity_category', ['entityId', 'categoryId'], {
  unique: true,
})
export class CategoryMapping extends BaseEntity<CategoryMapping> {
  @Column({
    type: 'uuid',
    comment: '엔티티 ID (다형성: 어떤 엔티티든 참조 가능)',
  })
  entityId: string;

  @Column({
    type: 'uuid',
    comment: '카테고리 ID',
  })
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): CategoryMapping {
    return this;
  }
}
