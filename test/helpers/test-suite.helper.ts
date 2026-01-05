import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppModule } from '@/app.module';

/**
 * E2E 테스트를 위한 테스트 스위트 헬퍼
 */
export class TestSuiteHelper {
  private app: INestApplication;
  private dataSource: DataSource;

  /**
   * 테스트 애플리케이션을 초기화한다
   */
  async initializeApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();

    // Validation Pipe 설정 (실제 애플리케이션과 동일하게)
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    this.dataSource = moduleFixture.get(DataSource);

    await this.app.init();

    return this.app;
  }

  /**
   * 애플리케이션을 종료한다
   */
  async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  /**
   * 테스트 전 데이터베이스를 정리한다
   */
  async cleanupBeforeTest(): Promise<void> {
    if (!this.dataSource) {
      return;
    }

    const entities = this.dataSource.entityMetadatas;

    // 외래 키 제약 조건 임시 비활성화
    await this.dataSource.query('SET CONSTRAINTS ALL DEFERRED');

    // 모든 테이블 데이터 삭제 (순서 중요)
    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
      );
    }

    // 외래 키 제약 조건 다시 활성화
    await this.dataSource.query('SET CONSTRAINTS ALL IMMEDIATE');
  }

  /**
   * 특정 테이블의 데이터를 정리한다
   */
  async cleanupTable(tableName: string): Promise<void> {
    if (!this.dataSource) {
      return;
    }

    await this.dataSource.query(
      `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`,
    );
  }

  /**
   * 애플리케이션 인스턴스를 반환한다
   */
  getApp(): INestApplication {
    return this.app;
  }

  /**
   * DataSource를 반환한다
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }
}
