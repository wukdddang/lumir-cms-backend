import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  VersionColumn,
} from 'typeorm';

/**
 * 기본 엔티티 인터페이스
 *
 * 모든 엔티티가 공통으로 가져야 하는 속성과 메서드를 정의합니다.
 */
export interface IBaseEntity<T = any> {
  /** 고유 식별자 */
  id: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 (소프트 삭제) */
  deletedAt?: Date;
  /** 생성자 ID */
  createdBy: string | null;
  /** 수정자 ID */
  updatedBy: string | null;
  /** 버전 (낙관적 잠금용) */
  version: number;

  /** 엔티티가 삭제되었는지 확인한다 */
  삭제되었는가(): boolean;
  /** 엔티티가 새로 생성된 것인지 확인한다 */
  새로_생성되었는가(): boolean;
  /** 생성자를 설정한다 */
  생성자를_설정한다(userId: string): void;
  /** 수정자를 설정한다 */
  수정자를_설정한다(userId: string): void;
  /** 엔티티 메타데이터를 업데이트한다 */
  메타데이터를_업데이트한다(userId?: string): void;
  /** 엔티티를 DTO로 변환한다 */
  DTO로_변환한다(): T;
}

/**
 * 숫자 ID를 사용하는 기본 엔티티 인터페이스
 */
export interface IBaseEntityWithNumericId<T = any> {
  /** 고유 식별자 (숫자) */
  id: number;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 (소프트 삭제) */
  deletedAt?: Date;
  /** 생성자 ID */
  createdBy: string | null;
  /** 수정자 ID */
  updatedBy: string | null;
  /** 버전 (낙관적 잠금용) */
  version: number;

  /** 엔티티가 삭제되었는지 확인한다 */
  삭제되었는가(): boolean;
  /** 엔티티가 새로 생성된 것인지 확인한다 */
  새로_생성되었는가(): boolean;
  /** 생성자를 설정한다 */
  생성자를_설정한다(userId: string): void;
  /** 수정자를 설정한다 */
  수정자를_설정한다(userId: string): void;
  /** 엔티티 메타데이터를 업데이트한다 */
  메타데이터를_업데이트한다(userId?: string): void;
  /** 엔티티를 DTO로 변환한다 */
  DTO로_변환한다(): T;
}

/**
 * 기본 엔티티 클래스
 *
 * 모든 엔티티가 공통으로 가져야 하는 필드들을 정의합니다.
 * 감사 추적, 소프트 삭제, 낙관적 잠금 등의 기능을 제공합니다.
 */
export abstract class BaseEntity<T> implements IBaseEntity<T> {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: '생성 일시',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    comment: '수정 일시',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '삭제 일시 (소프트 삭제)',
  })
  deletedAt?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '생성자 ID',
  })
  createdBy: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '수정자 ID',
  })
  updatedBy: string | null;

  @VersionColumn({
    comment: '버전 (낙관적 잠금용)',
  })
  version: number;

  /**
   * UUID 형식을 검증한다
   */
  protected validateUuidFormat(value: string, fieldName: string): void {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(value)) {
      throw new Error(
        `${fieldName}은(는) 유효한 UUID 형식이어야 합니다: ${value}`,
      );
    }
  }

  /**
   * 여러 UUID 필드를 한번에 검증한다
   */
  protected validateUuidFields(
    fields: { value: string; name: string }[],
  ): void {
    fields.forEach((field) => {
      if (field.value) {
        this.validateUuidFormat(field.value, field.name);
      }
    });
  }

  /**
   * 엔티티가 삭제되었는지 확인한다
   */
  삭제되었는가(): boolean {
    return this.deletedAt !== null && this.deletedAt !== undefined;
  }

  /**
   * 엔티티가 새로 생성된 것인지 확인한다
   */
  새로_생성되었는가(): boolean {
    return !this.id || this.version === 1;
  }

  /**
   * 생성자를 설정한다
   */
  생성자를_설정한다(userId: string): void {
    this.createdBy = userId;
  }

  /**
   * 수정자를 설정한다
   */
  수정자를_설정한다(userId: string): void {
    this.updatedBy = userId;
  }

  /**
   * 엔티티 메타데이터를 업데이트한다
   *
   * @remarks
   * createdAt과 updatedAt은 TypeORM의 @CreateDateColumn과 @UpdateDateColumn 데코레이터가 자동으로 관리합니다.
   * 이 메서드에서는 createdBy와 updatedBy만 설정합니다.
   */
  메타데이터를_업데이트한다(userId?: string): void {
    if (userId) {
      if (this.새로_생성되었는가()) {
        this.createdBy = userId;
      }
      this.updatedBy = userId;
    }
  }

  /**
   * 엔티티를 DTO로 변환한다
   */
  abstract DTO로_변환한다(): T;

  // 기존 메서드들도 유지 (하위 호환성)
  get isDeleted(): boolean {
    return this.삭제되었는가();
  }

  get isNew(): boolean {
    return this.새로_생성되었는가();
  }

  setCreatedBy(userId: string): void {
    this.생성자를_설정한다(userId);
  }

  setUpdatedBy(userId: string): void {
    this.수정자를_설정한다(userId);
  }

  updateMetadata(userId?: string): void {
    this.메타데이터를_업데이트한다(userId);
  }
}

/**
 * 숫자 ID를 사용하는 기본 엔티티 클래스
 */
export abstract class BaseEntityWithNumericId<T>
  implements IBaseEntityWithNumericId<T>
{
  @PrimaryGeneratedColumn({
    comment: '기본키 (자동 증가)',
  })
  id: number;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: '생성 일시',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    comment: '수정 일시',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '삭제 일시 (소프트 삭제)',
  })
  deletedAt?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '생성자 ID',
  })
  createdBy: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '수정자 ID',
  })
  updatedBy: string | null;

  @VersionColumn({
    comment: '버전 (낙관적 잠금용)',
  })
  version: number;

  /**
   * 엔티티가 삭제되었는지 확인한다
   */
  삭제되었는가(): boolean {
    return this.deletedAt !== null && this.deletedAt !== undefined;
  }

  /**
   * 엔티티가 새로 생성된 것인지 확인한다
   */
  새로_생성되었는가(): boolean {
    return !this.id || this.version === 1;
  }

  /**
   * 생성자를 설정한다
   */
  생성자를_설정한다(userId: string): void {
    this.createdBy = userId;
  }

  /**
   * 수정자를 설정한다
   */
  수정자를_설정한다(userId: string): void {
    this.updatedBy = userId;
  }

  /**
   * 엔티티 메타데이터를 업데이트한다
   *
   * @remarks
   * createdAt과 updatedAt은 TypeORM의 @CreateDateColumn과 @UpdateDateColumn 데코레이터가 자동으로 관리합니다.
   * 이 메서드에서는 createdBy와 updatedBy만 설정합니다.
   */
  메타데이터를_업데이트한다(userId?: string): void {
    if (userId) {
      if (this.새로_생성되었는가()) {
        this.createdBy = userId;
      }
      this.updatedBy = userId;
    }
  }

  /**
   * 엔티티를 DTO로 변환한다
   */
  abstract DTO로_변환한다(): T;

  // 기존 메서드들도 유지 (하위 호환성)
  get isDeleted(): boolean {
    return this.삭제되었는가();
  }

  get isNew(): boolean {
    return this.새로_생성되었는가();
  }

  setCreatedBy(userId: string): void {
    this.생성자를_설정한다(userId);
  }

  setUpdatedBy(userId: string): void {
    this.수정자를_설정한다(userId);
  }

  updateMetadata(userId?: string): void {
    this.메타데이터를_업데이트한다(userId);
  }
}
