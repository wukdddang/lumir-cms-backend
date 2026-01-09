import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  QueryFailedError,
  Repository,
} from 'typeorm';
import {
  IAggregateRoot,
  IDomainEvent,
} from './interfaces/repository.interface';

/**
 * 데이터베이스 예외 타입
 */
export enum DatabaseErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  UNIQUE_VIOLATION = 'UNIQUE_VIOLATION',
  NOT_NULL_VIOLATION = 'NOT_NULL_VIOLATION',
  CHECK_VIOLATION = 'CHECK_VIOLATION',
  DEADLOCK = 'DEADLOCK',
  TIMEOUT = 'TIMEOUT',
  SERIALIZATION_FAILURE = 'SERIALIZATION_FAILURE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 커스텀 데이터베이스 예외 클래스
 */
export class DatabaseException extends Error {
  constructor(
    public readonly type: DatabaseErrorType,
    public readonly originalError: any, // QueryFailedError 등 다양한 타입을 수용
    public readonly query?: string,
    public readonly parameters?: any[],
  ) {
    super(originalError.message);
    this.name = 'DatabaseException';
  }
}

/**
 * 도메인별 실행 컨텍스트
 */
export interface DomainExecutionContext {
  executeSafeOperation<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T>;
}

/**
 * 트랜잭션 매니저 서비스
 *
 * DDD Aggregate 패턴과 CQRS를 지원하는 트랜잭션 인프라를 제공합니다.
 */
@Injectable()
export class TransactionManagerService {
  private readonly logger = new Logger(TransactionManagerService.name);
  private readonly errorHandlers = new Map<
    string,
    (error: DatabaseException) => Error | null
  >();

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * HTTP 예외(비즈니스 예외)인지 확인한다
   *
   * @param error 확인할 에러 객체
   * @returns HTTP 예외인 경우 true
   */
  private isHttpException(error: any): boolean {
    return (
      (error.response && error.status) ||
      (typeof error.statusCode === 'number' &&
        error.statusCode >= 400 &&
        error.statusCode < 600) ||
      (error.name &&
        error.name.includes('Exception') &&
        typeof error.getStatus === 'function')
    );
  }

  /**
   * 데이터베이스 에러를 분석하고 적절한 예외로 변환한다
   */
  private handleDatabaseError(error: any, context?: string): DatabaseException {
    // NestJS HTTP 예외들은 그대로 다시 던짐 (DatabaseException으로 래핑하지 않음)
    // 로깅하기 전에 먼저 체크하여 비즈니스 예외를 데이터베이스 에러로 로깅하지 않도록 함
    if (this.isHttpException(error)) {
      throw error; // BadRequestException, UnprocessableEntityException 등
    }

    // 실제 데이터베이스 에러만 로깅
    this.logger.error(`데이터베이스 에러 발생 [${context || 'Unknown'}]:`, {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      column: error.column,
      stack: error.stack,
    });

    // 도메인 예외들을 HTTP 예외로 변환
    if (error.code && typeof error.code === 'string') {
      if (error.code.startsWith('DUPLICATE_')) {
        const ConflictException = require('@nestjs/common').ConflictException;
        throw new ConflictException(error.message);
      }
      // 다른 도메인 예외 코드들도 여기서 처리 가능
    }

    // PostgreSQL 에러 코드 기반 분류
    if (error.code) {
      switch (error.code) {
        // 연결 관련 에러
        case 'ECONNREFUSED':
        case 'ENOTFOUND':
        case 'ETIMEDOUT':
        case '08000': // connection_exception
        case '08003': // connection_does_not_exist
        case '08006': // connection_failure
          return new DatabaseException(
            DatabaseErrorType.CONNECTION_ERROR,
            error,
            error.query,
            error.parameters,
          );

        // 제약 조건 위반
        case '23000': // integrity_constraint_violation
        case '23001': // restrict_violation
          return new DatabaseException(
            DatabaseErrorType.CONSTRAINT_VIOLATION,
            error,
            error.query,
            error.parameters,
          );

        // 외래키 제약 조건 위반
        case '23503': // foreign_key_violation
          return new DatabaseException(
            DatabaseErrorType.FOREIGN_KEY_VIOLATION,
            error,
            error.query,
            error.parameters,
          );

        // 유니크 제약 조건 위반
        case '23505': // unique_violation
          return new DatabaseException(
            DatabaseErrorType.UNIQUE_VIOLATION,
            error,
            error.query,
            error.parameters,
          );

        // NOT NULL 제약 조건 위반
        case '23502': // not_null_violation
          return new DatabaseException(
            DatabaseErrorType.NOT_NULL_VIOLATION,
            error,
            error.query,
            error.parameters,
          );

        // CHECK 제약 조건 위반
        case '23514': // check_violation
          return new DatabaseException(
            DatabaseErrorType.CHECK_VIOLATION,
            error,
            error.query,
            error.parameters,
          );

        // 데드락
        case '40P01': // deadlock_detected
          return new DatabaseException(
            DatabaseErrorType.DEADLOCK,
            error,
            error.query,
            error.parameters,
          );

        // 직렬화 실패
        case '40001': // serialization_failure
          return new DatabaseException(
            DatabaseErrorType.SERIALIZATION_FAILURE,
            error,
            error.query,
            error.parameters,
          );

        // 타임아웃
        case '57014': // query_canceled
        case '57P01': // admin_shutdown
          return new DatabaseException(
            DatabaseErrorType.TIMEOUT,
            error,
            error.query,
            error.parameters,
          );
      }
    }

    // TypeORM 에러 타입 기반 분류
    if (error instanceof QueryFailedError) {
      return new DatabaseException(
        DatabaseErrorType.CONSTRAINT_VIOLATION,
        error,
        error.query,
        error.parameters,
      );
    }

    // 기본 에러
    return new DatabaseException(
      DatabaseErrorType.UNKNOWN_ERROR,
      error,
      error.query,
      error.parameters,
    );
  }

  /**
   * 재시도 가능한 에러인지 확인한다
   */
  private isRetryableError(error: DatabaseException): boolean {
    return [
      DatabaseErrorType.DEADLOCK,
      DatabaseErrorType.SERIALIZATION_FAILURE,
      DatabaseErrorType.CONNECTION_ERROR,
      DatabaseErrorType.TIMEOUT,
    ].includes(error.type);
  }

  /**
   * 재시도 로직을 포함한 트랜잭션 실행
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    context: string = 'Transaction',
  ): Promise<T> {
    let lastError: DatabaseException | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        // HTTP 예외(비즈니스 예외)인 경우 그대로 전파 (재시도하지 않음)
        if (this.isHttpException(error)) {
          throw error;
        }

        const dbError = this.handleDatabaseError(error, context);
        lastError = dbError;

        if (!this.isRetryableError(dbError) || attempt === maxRetries) {
          throw dbError;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 지수 백오프
        this.logger.warn(
          `트랜잭션 재시도 ${attempt}/${maxRetries} (${delay}ms 대기): ${dbError.message}`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * 단일 트랜잭션 실행한다
   *
   * @param operation 트랜잭션 내에서 실행할 작업
   * @param maxRetries 최대 재시도 횟수 (기본값: 3)
   * @returns 작업 결과
   */
  async executeTransaction<T>(
    operation: (manager: EntityManager) => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    return this.executeWithRetry(
      async () => {
        const queryRunner = this.dataSource.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();

          const result = await operation(queryRunner.manager);

          await queryRunner.commitTransaction();

          return result;
        } catch (error) {
          await queryRunner.rollbackTransaction();

          // HTTP 예외(비즈니스 예외)인 경우 그대로 전파
          if (this.isHttpException(error)) {
            throw error;
          }

          throw this.handleDatabaseError(error, '단일 트랜잭션');
        } finally {
          await queryRunner.release();
        }
      },
      maxRetries,
      '단일 트랜잭션',
    );
  }

  /**
   * 중첩 트랜잭션을 실행한다 (Savepoint 사용)
   *
   * @param operation 중첩 트랜잭션 내에서 실행할 작업
   * @param savepointName 세이브포인트 이름
   * @param maxRetries 최대 재시도 횟수 (기본값: 3)
   * @returns 작업 결과
   */
  async executeNestedTransaction<T>(
    operation: (manager: EntityManager) => Promise<T>,
    savepointName: string = `sp_${Date.now()}`,
    maxRetries: number = 3,
  ): Promise<T> {
    return this.executeWithRetry(
      async () => {
        const queryRunner = this.dataSource.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();

          // 세이브포인트 생성
          await queryRunner.query(`SAVEPOINT ${savepointName}`);

          const result = await operation(queryRunner.manager);

          // 세이브포인트 해제
          await queryRunner.query(`RELEASE SAVEPOINT ${savepointName}`);
          await queryRunner.commitTransaction();

          this.logger.debug(
            `중첩 트랜잭션(${savepointName})이 성공적으로 완료되었습니다.`,
          );

          return result;
        } catch (error) {
          // 세이브포인트로 롤백
          await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          await queryRunner.rollbackTransaction();
          this.logger.debug(
            `중첩 트랜잭션(${savepointName})이 롤백되었습니다.`,
          );

          throw this.handleDatabaseError(error, '중첩 트랜잭션');
        } finally {
          await queryRunner.release();
        }
      },
      maxRetries,
      `중첩 트랜잭션(${savepointName})`,
    );
  }

  /**
   * 여러 작업을 하나의 트랜잭션으로 묶어서 실행한다
   *
   * @param operations 실행할 작업들의 배열
   * @returns 모든 작업의 결과 배열
   */
  async executeBatchTransaction<T>(
    operations: Array<(manager: EntityManager) => Promise<T>>,
  ): Promise<T[]> {
    return this.executeTransaction(async (manager) => {
      const results: T[] = [];

      for (const operation of operations) {
        const result = await operation(manager);
        results.push(result);
      }

      return results;
    });
  }

  /**
   * 도메인 이벤트와 함께 트랜잭션을 실행한다
   *
   * @param aggregates 도메인 이벤트를 가진 Aggregate들
   * @param operation 트랜잭션 내에서 실행할 작업
   * @returns 작업 결과
   */
  async executeTransactionWithDomainEvents<T>(
    aggregates: IAggregateRoot[],
    operation: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.executeTransaction(async (manager) => {
      // 비즈니스 로직 실행
      const result = await operation(manager);

      // 도메인 이벤트 수집 및 처리
      const domainEvents: IDomainEvent[] = [];
      aggregates.forEach((aggregate) => {
        domainEvents.push(...aggregate.getDomainEvents());
        aggregate.clearDomainEvents();
      });

      // 도메인 이벤트 발행 (실제 구현에서는 이벤트 버스 사용)
      if (domainEvents.length > 0) {
        this.logger.debug(
          `${domainEvents.length}개의 도메인 이벤트를 처리합니다.`,
        );
        await this.processDomainEvents(domainEvents, manager);
      }

      return result;
    });
  }

  /**
   * 읽기 전용 트랜잭션을 실행한다
   *
   * @param operation 읽기 작업
   * @param maxRetries 최대 재시도 횟수 (기본값: 2)
   * @returns 작업 결과
   */
  async executeReadOnlyTransaction<T>(
    operation: (manager: EntityManager) => Promise<T>,
    maxRetries: number = 2,
  ): Promise<T> {
    return this.executeWithRetry(
      async () => {
        const queryRunner = this.dataSource.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction('READ COMMITTED');

          // 읽기 전용 모드 설정
          await queryRunner.query('SET TRANSACTION READ ONLY');

          const result = await operation(queryRunner.manager);

          await queryRunner.commitTransaction();
          this.logger.debug('읽기 전용 트랜잭션이 성공적으로 완료되었습니다.');

          return result;
        } catch (error) {
          try {
            await queryRunner.rollbackTransaction();
            this.logger.debug('읽기 전용 트랜잭션이 롤백되었습니다.');
          } catch (rollbackError) {
            this.logger.error(
              '읽기 전용 트랜잭션 롤백 중 오류 발생:',
              rollbackError,
            );
          }
          throw error;
        } finally {
          try {
            await queryRunner.release();
          } catch (releaseError) {
            this.logger.error('QueryRunner 해제 중 오류 발생:', releaseError);
          }
        }
      },
      maxRetries,
      '읽기 전용 트랜잭션',
    );
  }

  /**
   * 트랜잭션 격리 수준을 지정하여 실행한다
   *
   * @param isolationLevel 격리 수준
   * @param operation 실행할 작업
   * @param maxRetries 최대 재시도 횟수 (기본값: 5, SERIALIZABLE은 재시도가 중요)
   * @returns 작업 결과
   */
  async executeTransactionWithIsolationLevel<T>(
    isolationLevel:
      | 'READ UNCOMMITTED'
      | 'READ COMMITTED'
      | 'REPEATABLE READ'
      | 'SERIALIZABLE',
    operation: (manager: EntityManager) => Promise<T>,
    maxRetries: number = isolationLevel === 'SERIALIZABLE' ? 5 : 3,
  ): Promise<T> {
    return this.executeWithRetry(
      async () => {
        const queryRunner = this.dataSource.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction(isolationLevel);

          const result = await operation(queryRunner.manager);

          await queryRunner.commitTransaction();
          this.logger.debug(
            `격리 수준 ${isolationLevel}로 트랜잭션이 완료되었습니다.`,
          );

          return result;
        } catch (error) {
          try {
            await queryRunner.rollbackTransaction();
            this.logger.debug(
              `격리 수준 ${isolationLevel} 트랜잭션이 롤백되었습니다.`,
            );
          } catch (rollbackError) {
            this.logger.error(
              `격리 수준 ${isolationLevel} 트랜잭션 롤백 중 오류 발생:`,
              rollbackError,
            );
          }
          throw error;
        } finally {
          try {
            await queryRunner.release();
          } catch (releaseError) {
            this.logger.error('QueryRunner 해제 중 오류 발생:', releaseError);
          }
        }
      },
      maxRetries,
      `격리 수준 ${isolationLevel} 트랜잭션`,
    );
  }

  /**
   * 리포지토리를 가져온다 (트랜잭션 지원)
   *
   * EntityManager가 제공되면 트랜잭션 내의 리포지토리를 사용하고,
   * 그렇지 않으면 기본 리포지토리를 사용한다.
   *
   * @param entityClass 엔티티 클래스
   * @param defaultRepository 기본 리포지토리 (트랜잭션 외부용)
   * @param manager 트랜잭션 매니저 (선택적)
   * @returns 적절한 리포지토리 인스턴스
   */
  getRepository<T extends ObjectLiteral>(
    entityClass: EntityTarget<T>,
    defaultRepository: Repository<T>,
    manager?: EntityManager,
  ): Repository<T> {
    return manager ? manager.getRepository(entityClass) : defaultRepository;
  }

  /**
   * 도메인별 에러 핸들러를 등록한다
   *
   * @param domain 도메인 이름 (예: '프로젝트', '사용자' 등)
   * @param errorHandler 에러 변환 함수
   */
  registerDomainErrorHandler(domain: string): void {
    this.logger.debug(`도메인 에러 핸들러 등록됨: ${domain}`);
  }

  /**
   * 도메인별 실행 컨텍스트를 생성한다
   *
   * @param domain 도메인 이름
   * @returns 도메인별 실행 컨텍스트
   */
  createDomainContext(domain: string): DomainExecutionContext {
    const errorHandler = this.errorHandlers.get(domain);

    return {
      executeSafeOperation: <T>(
        operation: () => Promise<T>,
        context: string,
      ): Promise<T> => {
        return this.executeSafeOperation(operation, context, errorHandler);
      },
    };
  }

  /**
   * 안전한 데이터베이스 작업을 실행한다 (도메인별 에러 핸들러 사용)
   *
   * @param operation 실행할 작업
   * @param context 작업 컨텍스트 (로깅용)
   * @param domain 도메인 이름 (등록된 에러 핸들러 사용)
   * @returns 작업 결과
   */
  async executeDomainOperation<T>(
    operation: () => Promise<T>,
    context: string,
    domain: string,
  ): Promise<T> {
    const errorHandler = this.errorHandlers.get(domain);
    return this.executeSafeOperation(operation, context, errorHandler);
  }

  /**
   * 안전한 데이터베이스 작업을 실행한다
   *
   * 데이터베이스 에러를 자동으로 처리하고, 필요시 도메인별 에러 변환을 수행한다.
   *
   * @param operation 실행할 작업
   * @param context 작업 컨텍스트 (로깅용)
   * @param errorHandler 도메인별 에러 변환 함수 (선택적)
   * @returns 작업 결과
   */
  async executeSafeOperation<T>(
    operation: () => Promise<T>,
    context: string,
    errorHandler?: (error: DatabaseException) => Error | null,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // HTTP 예외(비즈니스 예외)인 경우 그대로 전파 (변환하지 않음)
      if (this.isHttpException(error)) {
        throw error;
      }

      // DatabaseException인 경우 그대로 사용, 아니면 변환
      const dbError =
        error instanceof DatabaseException
          ? error
          : this.handleDatabaseError(error, context);

      // 도메인별 에러 변환이 제공된 경우 사용
      if (errorHandler) {
        const domainError = errorHandler(dbError);
        if (domainError) {
          throw domainError;
        }
      }

      // 기본적으로 DatabaseException을 던짐
      throw dbError;
    }
  }

  /**
   * 도메인 이벤트를 처리한다
   *
   * @param events 처리할 도메인 이벤트들
   * @param manager 엔티티 매니저
   */
  private async processDomainEvents(
    events: IDomainEvent[],
    manager: EntityManager,
  ): Promise<void> {
    // 실제 구현에서는 이벤트 스토어에 저장하거나 이벤트 버스로 발행
    for (const event of events) {
      this.logger.debug(`도메인 이벤트 처리: ${event.eventType}`, {
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        occurredAt: event.occurredAt,
      });

      // 이벤트 스토어에 저장 (선택적)
      // await this.saveEvent(event, manager);
    }
  }
}
