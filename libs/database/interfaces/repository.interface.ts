import { FindManyOptions, FindOneOptions, FindOptionsWhere } from 'typeorm';

/**
 * Repository 인터페이스
 *
 * DDD Repository 패턴의 기본 인터페이스를 정의합니다.
 * 모든 Aggregate Repository는 이 인터페이스를 구현해야 합니다.
 */
export interface IRepository<TEntity, TId = string | number> {
  /**
   * ID로 엔티티 조회
   */
  findById(id: TId): Promise<TEntity | null>;

  /**
   * 조건에 맞는 엔티티 조회
   */
  findOne(options: FindOneOptions<TEntity>): Promise<TEntity | null>;

  /**
   * 조건에 맞는 모든 엔티티 조회
   */
  findMany(options?: FindManyOptions<TEntity>): Promise<TEntity[]>;

  /**
   * 엔티티 저장 (생성 또는 업데이트)
   */
  save(entity: TEntity): Promise<TEntity>;

  /**
   * 엔티티 삭제
   */
  delete(id: TId): Promise<void>;

  /**
   * 엔티티 존재 여부 확인
   */
  exists(options: FindOptionsWhere<TEntity>): Promise<boolean>;
}

/**
 * Aggregate Repository 인터페이스
 *
 * DDD Aggregate 패턴을 위한 확장된 Repository 인터페이스입니다.
 * 도메인 이벤트 처리와 트랜잭션 관리 기능을 포함합니다.
 */
export interface IAggregateRepository<
  TAggregate,
  TId = string | number,
> extends IRepository<TAggregate, TId> {
  /**
   * Aggregate 저장 (도메인 이벤트 처리 포함)
   */
  saveAggregate(aggregate: TAggregate): Promise<TAggregate>;

  /**
   * 트랜잭션 내에서 Aggregate 저장
   */
  saveAggregateInTransaction(
    aggregate: TAggregate,
    operation?: (aggregate: TAggregate) => Promise<void>,
  ): Promise<TAggregate>;
}

/**
 * 읽기 전용 Repository 인터페이스
 *
 * CQRS 패턴의 Query Side를 위한 읽기 전용 Repository입니다.
 */
export interface IReadOnlyRepository<TView, TId = string | number> {
  /**
   * ID로 뷰 조회
   */
  findById(id: TId): Promise<TView | null>;

  /**
   * 조건에 맞는 뷰 조회
   */
  findOne(options: FindOneOptions<TView>): Promise<TView | null>;

  /**
   * 조건에 맞는 모든 뷰 조회
   */
  findMany(options?: FindManyOptions<TView>): Promise<TView[]>;

  /**
   * 페이지네이션을 지원하는 뷰 조회
   */
  findWithPagination(
    options: FindManyOptions<TView>,
    page: number,
    limit: number,
  ): Promise<{
    data: TView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * 조건에 맞는 뷰 개수 조회
   */
  count(options?: FindManyOptions<TView>): Promise<number>;
}

/**
 * 도메인 이벤트 인터페이스
 */
export interface IDomainEvent {
  /**
   * 이벤트 ID
   */
  eventId: string;

  /**
   * 이벤트 타입
   */
  eventType: string;

  /**
   * 이벤트 발생 시간
   */
  occurredAt: Date;

  /**
   * Aggregate ID
   */
  aggregateId: string | number;

  /**
   * 이벤트 데이터
   */
  eventData: Record<string, any>;
}

/**
 * 도메인 이벤트를 가지는 Aggregate 인터페이스
 */
export interface IAggregateRoot {
  /**
   * 도메인 이벤트 목록 조회
   */
  getDomainEvents(): IDomainEvent[];

  /**
   * 도메인 이벤트 추가
   */
  addDomainEvent(event: IDomainEvent): void;

  /**
   * 도메인 이벤트 목록 초기화
   */
  clearDomainEvents(): void;
}

/**
 * Unit of Work 인터페이스
 *
 * 여러 Aggregate의 변경사항을 하나의 트랜잭션으로 관리합니다.
 */
export interface IUnitOfWork {
  /**
   * 새로운 엔티티 등록
   */
  registerNew<T>(entity: T): void;

  /**
   * 수정된 엔티티 등록
   */
  registerDirty<T>(entity: T): void;

  /**
   * 삭제된 엔티티 등록
   */
  registerDeleted<T>(entity: T): void;

  /**
   * 모든 변경사항 커밋
   */
  commit(): Promise<void>;

  /**
   * 모든 변경사항 롤백
   */
  rollback(): Promise<void>;
}
