import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/base/base.entity';
import { CategoryEntityType } from './category-entity-type.types';

/**
 * Category Entity (카테고리)
 * 
 * 모든 도메인에서 공유하는 통합 카테고리 관리
 * entityType 필드로 도메인 구분
 */
@Entity('categories')
@Index('idx_category_entity_type', ['entityType'])
@Index('idx_category_is_active', ['isActive'])
@Index('idx_category_order', ['order'])
export class Category extends BaseEntity<Category> {
  @Column({
    type: 'enum',
    enum: CategoryEntityType,
    comment: '엔티티 타입 (announcement|main_popup|shareholders_meeting|...)',
  })
  entityType: CategoryEntityType;

  @Column({
    type: 'varchar',
    length: 200,
    comment: '카테고리 이름',
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '카테고리 설명',
  })
  description: string | null;

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
  DTO로_변환한다(): Category {
    return this;
  }
}
