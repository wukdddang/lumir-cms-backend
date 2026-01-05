import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { DepartmentDto } from './department.types';

/**
 * 부서 엔티티
 *
 * 회사의 부서 정보와 계층 구조를 관리합니다.
 * 외부 메타데이터 매니저와 동기화됩니다.
 */
@Entity('department')
@Index(['externalId'], { unique: true })
export class Department extends BaseEntity<DepartmentDto> {
  @Column({
    type: 'varchar',
    length: 255,
    comment: '부서명',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '부서 코드',
  })
  code: string;

  @Column({
    type: 'int',
    comment: '정렬 순서',
    default: 0,
  })
  order: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '매니저 ID',
  })
  managerId?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '상위 부서 ID (외부 시스템)',
  })
  parentDepartmentId?: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    comment: '외부 시스템 ID',
  })
  externalId: string;

  @Column({
    type: 'timestamp',
    comment: '외부 시스템 생성일',
  })
  externalCreatedAt: Date;

  @Column({
    type: 'timestamp',
    comment: '외부 시스템 수정일',
  })
  externalUpdatedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '마지막 동기화 시간',
  })
  lastSyncAt?: Date;

  constructor(
    name?: string,
    code?: string,
    externalId?: string,
    order?: number,
    managerId?: string,
    parentDepartmentId?: string,
    externalCreatedAt?: Date,
    externalUpdatedAt?: Date,
  ) {
    super();
    if (name) this.name = name;
    if (code) this.code = code;
    if (externalId) this.externalId = externalId;
    if (order !== undefined) this.order = order;
    if (managerId) this.managerId = managerId;
    if (parentDepartmentId) this.parentDepartmentId = parentDepartmentId;
    if (externalCreatedAt) this.externalCreatedAt = externalCreatedAt;
    if (externalUpdatedAt) this.externalUpdatedAt = externalUpdatedAt;
  }

  /**
   * Department 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): DepartmentDto {
    return {
      // BaseEntity 필드들
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      version: this.version,

      // Department 엔티티 필드들
      name: this.name,
      code: this.code,
      order: this.order,
      managerId: this.managerId,
      parentDepartmentId: this.parentDepartmentId,
      externalId: this.externalId,
      externalCreatedAt: this.externalCreatedAt,
      externalUpdatedAt: this.externalUpdatedAt,
      lastSyncAt: this.lastSyncAt,

      // 계산된 필드들
      get isDeleted() {
        return this.deletedAt !== null && this.deletedAt !== undefined;
      },
      get isNew() {
        return !this.id || this.version === 1;
      },
      get isRootDepartment() {
        return !this.parentDepartmentId;
      },
      get hasChildren() {
        return false;
      }, // 실제로는 하위 부서 조회 로직 필요
      get needsSync() {
        if (!this.lastSyncAt) return true;
        const now = new Date();
        const diffHours =
          Math.abs(now.getTime() - this.lastSyncAt.getTime()) /
          (1000 * 60 * 60);
        return diffHours >= 24; // 24시간 이상 지났으면 동기화 필요
      },
    };
  }

  /**
   * Department 엔티티를 DTO로 변환
   */
}
