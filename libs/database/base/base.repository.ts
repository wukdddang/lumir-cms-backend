import {
  Repository,
  EntityTarget,
  DataSource,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
} from 'typeorm';
import { Logger } from '@nestjs/common';

/**
 * 기본 Repository 클래스
 *
 * DDD Repository 패턴을 구현하는 기본 클래스입니다.
 * 모든 Aggregate Repository는 이 클래스를 상속받아 구현합니다.
 */
export abstract class BaseRepository<
  TEntity extends ObjectLiteral,
  TId = string | number,
> {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly repository: Repository<TEntity>;

  constructor(
    protected readonly dataSource: DataSource,
    private readonly entityTarget: EntityTarget<TEntity>,
  ) {
    this.repository = this.dataSource.getRepository(entityTarget);
  }

  /**
   * ID로 엔티티 조회
   */
  async findById(id: TId): Promise<TEntity | null> {
    try {
      const entity = await this.repository.findOne({
        where: { id } as FindOptionsWhere<TEntity>,
      });
      return entity || null;
    } catch (error) {
      this.logger.error(`엔티티 조회 실패 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 조건에 맞는 엔티티 조회
   */
  async findOne(options: FindOneOptions<TEntity>): Promise<TEntity | null> {
    try {
      const entity = await this.repository.findOne(options);
      return entity || null;
    } catch (error) {
      this.logger.error('엔티티 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 조건에 맞는 모든 엔티티 조회
   */
  async findMany(options?: FindManyOptions<TEntity>): Promise<TEntity[]> {
    try {
      return await this.repository.find(options);
    } catch (error) {
      this.logger.error('엔티티 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 조건에 맞는 엔티티 개수 조회
   */
  async count(options?: FindManyOptions<TEntity>): Promise<number> {
    try {
      return await this.repository.count(options);
    } catch (error) {
      this.logger.error('엔티티 개수 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 엔티티 존재 여부 확인
   */
  async exists(options: FindOptionsWhere<TEntity>): Promise<boolean> {
    try {
      const count = await this.repository.count({ where: options });
      return count > 0;
    } catch (error) {
      this.logger.error('엔티티 존재 여부 확인 실패:', error);
      throw error;
    }
  }

  /**
   * 엔티티 저장 (생성 또는 업데이트)
   */
  async save(entity: TEntity): Promise<TEntity> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      this.logger.error('엔티티 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 여러 엔티티 저장
   */
  async saveMany(entities: TEntity[]): Promise<TEntity[]> {
    try {
      return await this.repository.save(entities);
    } catch (error) {
      this.logger.error('엔티티 목록 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 엔티티 삭제
   */
  async delete(id: TId): Promise<void> {
    try {
      await this.repository.delete(id as any);
    } catch (error) {
      this.logger.error(`엔티티 삭제 실패 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 조건에 맞는 엔티티 삭제
   */
  async deleteMany(criteria: FindOptionsWhere<TEntity>): Promise<void> {
    try {
      await this.repository.delete(criteria);
    } catch (error) {
      this.logger.error('엔티티 목록 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 엔티티 소프트 삭제 (deletedAt 필드 사용)
   */
  async softDelete(id: TId): Promise<void> {
    try {
      await this.repository.softDelete(id as any);
    } catch (error) {
      this.logger.error(`엔티티 소프트 삭제 실패 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 소프트 삭제된 엔티티 복구
   */
  async restore(id: TId): Promise<void> {
    try {
      await this.repository.restore(id as any);
    } catch (error) {
      this.logger.error(`엔티티 복구 실패 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 트랜잭션 내에서 작업 실행
   */
  async runInTransaction<TResult>(
    operation: (repository: Repository<TEntity>) => Promise<TResult>,
  ): Promise<TResult> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const transactionalRepository = queryRunner.manager.getRepository(
        this.entityTarget,
      );
      const result = await operation(transactionalRepository);

      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('트랜잭션 실행 실패:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 쿼리 빌더 생성
   */
  createQueryBuilder(alias?: string) {
    return this.repository.createQueryBuilder(alias);
  }

  /**
   * 원시 Repository 접근 (고급 사용자용)
   */
  getRepository(): Repository<TEntity> {
    return this.repository;
  }
}
