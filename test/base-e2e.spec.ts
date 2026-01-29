import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AuthContextService } from '../src/context/auth-context/auth-context.service';
import { SsoService } from '../src/domain/common/sso/sso.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { QueryFailedExceptionFilter } from '../src/interface/common/filters/query-failed-exception.filter';

/**
 * 테스트용 Mock Auth Context Service
 * 모든 토큰을 유효한 것으로 처리합니다
 */
class MockAuthContextService {
  async 토큰을_검증한다(accessToken: string) {
    return {
      user: {
        id: '00000000-0000-0000-0000-000000000099',
        email: 'test@example.com',
        name: 'Test User',
        employeeNumber: 'TEST001',
        roles: ['admin'],
        status: 'ACTIVE',
      },
      accessToken,
    };
  }

  async 로그인한다(email: string, password: string) {
    return {
      user: {
        id: '00000000-0000-0000-0000-000000000099',
        email,
        name: 'Test User',
        employeeNumber: 'TEST001',
        roles: ['admin'],
        status: 'ACTIVE',
      },
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    };
  }
}

/**
 * 테스트용 Mock SSO Service
 * 외부 SSO API 호출을 모킹하여 실제 호출 없이 테스트합니다
 */
class MockSsoService {
  /**
   * FCM 토큰 조회 모킹
   * 실제 SSO 서버 호출 대신 빈 배열 반환
   */
  async FCM_토큰을_조회한다(params: {
    employeeNumbers?: string | string[];
    employeeIds?: string | string[];
  }) {
    // 테스트 환경에서는 빈 토큰 목록 반환
    // 실제 알림은 전송되지 않지만 API는 정상 작동
    return [];
  }

  /**
   * 부서 목록 조회 모킹
   */
  async 부서_목록을_조회한다() {
    return [];
  }

  /**
   * 직원 목록 조회 모킹
   */
  async 직원_목록을_조회한다() {
    return [];
  }

  /**
   * 특정 직원 정보 조회 모킹
   */
  async 직원_정보를_조회한다(employeeId: string) {
    return {
      id: employeeId,
      name: 'Mock User',
      email: 'mock@example.com',
      departmentId: 'mock-dept-id',
      rankCode: 'STAFF',
      positionCode: 'EMPLOYEE',
      isActive: true,
    };
  }

  /**
   * 부서 정보 목록 조회 모킹
   * 권한 검증 스케줄러에서 사용
   */
  async 부서_정보_목록을_조회한다(departmentIds: string[]) {
    // 테스트 환경에서는 모든 부서가 유효한 것으로 처리
    const result = new Map();
    departmentIds.forEach((id) => {
      result.set(id, {
        id,
        name: `Mock Department ${id}`,
        isActive: true,
      });
    });
    return result;
  }
}

/**
 * E2E 테스트 베이스 클래스
 * 모든 E2E 테스트에서 상속받아 사용
 */
export class BaseE2ETest {
  public app: INestApplication;
  protected dataSource: DataSource;
  private testAccessToken = 'test-access-token';
  protected skipDefaultLanguageInit = false; // 기본 언어 초기화 건너뛰기 옵션

  /**
   * supertest request 반환
   * 인증 헤더가 자동으로 포함됩니다
   * 사용법: testSuite.request().get('/api/endpoint')
   */
  request() {
    return {
      get: (url: string) =>
        request(this.app.getHttpServer())
          .get(url)
          .set('Authorization', `Bearer ${this.testAccessToken}`),
      post: (url: string) =>
        request(this.app.getHttpServer())
          .post(url)
          .set('Authorization', `Bearer ${this.testAccessToken}`),
      put: (url: string) =>
        request(this.app.getHttpServer())
          .put(url)
          .set('Authorization', `Bearer ${this.testAccessToken}`),
      patch: (url: string) =>
        request(this.app.getHttpServer())
          .patch(url)
          .set('Authorization', `Bearer ${this.testAccessToken}`),
      delete: (url: string) =>
        request(this.app.getHttpServer())
          .delete(url)
          .set('Authorization', `Bearer ${this.testAccessToken}`),
    };
  }

  /**
   * Repository 접근을 위한 public 메서드
   */
  getRepository(entityName: string) {
    return this.dataSource.getRepository(entityName);
  }

  /**
   * 테스트 애플리케이션 초기화
   */
  async initializeApp(): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthContextService)
      .useClass(MockAuthContextService)
      .overrideProvider(SsoService)
      .useClass(MockSsoService)
      .compile();

    this.app = moduleFixture.createNestApplication();

    // Global Prefix 설정
    this.app.setGlobalPrefix('api');

    // ValidationPipe 설정 (실제 애플리케이션과 동일하게)
    this.app.useGlobalPipes(
      new ValidationPipe({
        transform: false, // 타입 자동 변환 비활성화 (정확한 타입만 허용)
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    );

    // Exception Filter 설정 (실제 애플리케이션과 동일하게)
    this.app.useGlobalFilters(new QueryFailedExceptionFilter());

    // CORS 설정
    this.app.enableCors({
      origin: '*',
      methods: '*',
      allowedHeaders: '*',
      exposedHeaders: '*',
      credentials: false,
    });

    this.dataSource = moduleFixture.get<DataSource>(DataSource);

    // 테스트 환경에서 데이터베이스 스키마 동기화
    await this.dataSource.synchronize(true);

    await this.app.init();

    // 앱 초기화 후 스케줄러 중지 (테스트 환경에서는 크론 작업 실행 안 함)
    try {
      const schedulerRegistry = moduleFixture.get(SchedulerRegistry, {
        strict: false,
      });
      if (schedulerRegistry) {
        const cronJobs = schedulerRegistry.getCronJobs();
        cronJobs.forEach((job: any) => {
          job.stop();
        });
        console.log(`✅ 크론 작업 ${cronJobs.size}개 중지됨`);
      }
    } catch (error) {
      // 스케줄러가 없으면 무시
      console.log('⚠️ 스케줄러를 찾을 수 없습니다.');
    }

    // 테스트용 관리자 계정 추가 (AdminGuard 통과용)
    await this.initializeTestAdmin();

    // 기본 언어 초기화 (스케줄러에서 언어를 찾는 에러 방지)
    if (!this.skipDefaultLanguageInit) {
      await this.initializeDefaultLanguages();
    }
  }

  /**
   * 테스트용 관리자 계정 초기화
   * MockAuthContextService에서 반환하는 employeeNumber를 admins 테이블에 추가
   */
  private async initializeTestAdmin(): Promise<void> {
    try {
      const adminRepository = this.dataSource.getRepository('Admin');

      // 이미 존재하는지 확인
      const existingAdmin = await adminRepository.findOne({
        where: { employeeNumber: 'TEST001' },
      });

      if (!existingAdmin) {
        // 테스트용 관리자 계정 생성
        await adminRepository.save({
          employeeNumber: 'TEST001',
          name: 'Test User',
          email: 'test@example.com',
          isActive: true,
          notes: 'E2E 테스트용 관리자 계정',
        });
        console.log('✅ 테스트용 관리자 계정(TEST001) 추가 완료');
      }
    } catch (error) {
      console.warn(
        '⚠️ 테스트용 관리자 계정 초기화 중 오류 발생:',
        error.message || error,
      );
    }
  }

  /**
   * 기본 언어 초기화
   */
  private async initializeDefaultLanguages(): Promise<void> {
    try {
      // 기본 언어 초기화 API 호출
      const response = await request(this.app.getHttpServer())
        .post('/api/admin/languages/initialize-default')
        .set('Authorization', `Bearer ${this.testAccessToken}`)
        .expect(201);

      // 언어가 제대로 생성되었는지 확인
      if (
        response.body &&
        response.body.items &&
        response.body.items.length > 0
      ) {
        console.log(`✅ 기본 언어 ${response.body.items.length}개 초기화 완료`);
      }
    } catch (error) {
      console.warn('⚠️ 기본 언어 초기화 중 오류 발생:', error.message || error);
    }
  }

  /**
   * 테스트 애플리케이션 종료
   */
  async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  /**
   * 모든 테이블 데이터 초기화 (TRUNCATE)
   */
  private async cleanDatabase(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      return;
    }

    const entities = this.dataSource.entityMetadatas;

    // PostgreSQL의 경우 CASCADE를 사용하여 외래키 제약조건 무시
    try {
      // 모든 테이블 TRUNCATE
      for (const entity of entities) {
        const tableName = entity.tableName;
        await this.dataSource.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`,
        );
      }
    } catch (error) {
      console.warn('테이블 정리 중 오류 발생:', error);
      // 실패 시 개별 테이블 삭제 시도
      for (const entity of entities) {
        try {
          const repository = this.dataSource.getRepository(entity.name);
          await repository.clear();
        } catch (e) {
          console.warn(`테이블 ${entity.name} 정리 실패:`, e);
        }
      }
    }
  }

  /**
   * 특정 테이블들만 초기화
   */
  private async cleanTables(tableNames: string[]): Promise<void> {
    if (!this.dataSource.isInitialized) {
      return;
    }

    try {
      for (const tableName of tableNames) {
        await this.dataSource.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`,
        );
      }
    } catch (error) {
      console.warn('특정 테이블 정리 중 오류 발생:', error);
    }
  }

  /**
   * 각 테스트 전 데이터베이스 정리
   */
  async cleanupBeforeTest(): Promise<void> {
    await this.cleanDatabase();
    // 테스트용 관리자 계정 다시 추가
    await this.initializeTestAdmin();
    // 기본 언어 다시 초기화
    if (!this.skipDefaultLanguageInit) {
      await this.initializeDefaultLanguages();
    }
  }

  /**
   * 각 테스트 후 데이터베이스 정리
   */
  async cleanupAfterTest(): Promise<void> {
    await this.cleanDatabase();
  }

  /**
   * 특정 테이블들만 정리
   */
  async cleanupSpecificTables(tableNames: string[]): Promise<void> {
    await this.cleanTables(tableNames);
  }

  /**
   * 테스트 스위트 시작 전 초기화
   */
  async beforeAll(): Promise<void> {
    await this.initializeApp();
  }

  /**
   * 테스트 스위트 종료 후 정리
   */
  async afterAll(): Promise<void> {
    await this.closeApp();
  }
}
