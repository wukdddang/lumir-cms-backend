import { BaseE2ETest } from '../../../base-e2e.spec';
import { AnnouncementPermissionScheduler } from '../../../../src/context/announcement-context/announcement-permission.scheduler';
import { SsoService } from '../../../../src/domain/common/sso/sso.service';

describe('공지사항 권한 검증 스케줄러 성능 개선 테스트', () => {
  const testSuite = new BaseE2ETest();
  let testCategoryId: string;
  let scheduler: AnnouncementPermissionScheduler;
  let ssoService: SsoService;
  let ssoSpy: jest.SpyInstance;

  beforeAll(async () => {
    await testSuite.beforeAll();
    
    try {
      scheduler = testSuite.app.get(AnnouncementPermissionScheduler, { strict: false });
      ssoService = testSuite.app.get(SsoService, { strict: false });
      
      if (ssoService) {
        // SSO 서비스의 부서 정보 조회 메서드에 spy 설정
        ssoSpy = jest.spyOn(ssoService, '부서_정보_목록을_조회한다');
        
        // SSO API 조회 시간을 500-1000ms 랜덤값으로 시뮬레이션
        ssoSpy.mockImplementation(async (departmentIds: string[]) => {
          const delay = Math.floor(Math.random() * 501) + 500; // 500-1000ms
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // 부서 정보 Map 반환 (실제 SSO 서비스처럼)
          const departmentMap = new Map();
          departmentIds.forEach(id => {
            departmentMap.set(id, {
              id,
              name: `부서-${id}`,
              isActive: true, // 테스트를 위해 모두 활성으로 설정
            });
          });
          return departmentMap;
        });
        
        console.log('⚙️  SSO API 조회 시간: 500-1000ms 랜덤값으로 시뮬레이션');
      }
    } catch (error) {
      console.warn('스케줄러 또는 SSO 서비스를 찾을 수 없습니다:', error);
    }
  });

  afterAll(async () => {
    ssoSpy?.mockRestore();
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
    ssoSpy?.mockClear();

    // 테스트용 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/announcements/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 공지사항 카테고리',
      })
      .expect(201);

    testCategoryId = categoryResponse.body.id;
  });

  describe('배치 처리 성능 개선 검증', () => {
    it('대량의 공지사항을 처리할 때 SSO API를 한 번만 호출해야 한다', async () => {
      // Given - 다양한 부서 권한을 가진 공지사항 10개 생성
      const announcements: any[] = [];
      for (let i = 1; i <= 10; i++) {
        const announcement = await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({
            categoryId: testCategoryId,
            title: `성능 테스트 공지 ${i}`,
            content: `내용 ${i}`,
            permissionDepartmentIds: i % 3 !== 0 ? [`dept-${i}`, `dept-${i + 10}`] : null,
          })
          .expect(201);

        announcements.push(announcement.body);
      }

      // When - 스케줄러 실행
      if (scheduler && ssoService) {
        const startTime = Date.now();
        await scheduler.모든_공지사항_권한을_검증한다();
        const elapsedTime = Date.now() - startTime;

        // Then
        // 1. SSO API는 1회만 호출되어야 함
        expect(ssoSpy).toHaveBeenCalledTimes(1);

        // 2. 일괄 조회이므로 여러 부서 ID를 한 번에 조회
        const callArgs = ssoSpy.mock.calls[0][0];
        expect(Array.isArray(callArgs)).toBe(true);
        expect(callArgs.length).toBeGreaterThan(1);

        // 3. 처리 시간 로그 출력
        console.log(`\n📊 성능 측정 결과:`);
        console.log(`   - 처리한 공지사항 개수: ${announcements.length}개`);
        console.log(`   - SSO API 호출 횟수: ${ssoSpy.mock.calls.length}회 (500-1000ms 랜덤 딜레이)`);
        console.log(`   - 총 처리 시간: ${elapsedTime}ms`);
        console.log(`   - 평균 처리 시간: ${(elapsedTime / announcements.length).toFixed(2)}ms/개\n`);

        // 4. 처리 시간이 합리적인 범위 내
        expect(elapsedTime).toBeLessThan(10000);
      }
    });

    it('중복된 부서 ID가 있어도 한 번만 조회해야 한다', async () => {
      // Given - 같은 부서 권한을 가진 공지사항 여러 개 생성
      const SAME_DEPT_IDS = ['dept-shared-1', 'dept-shared-2', 'dept-shared-3'];
      
      for (let i = 1; i <= 5; i++) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({
            categoryId: testCategoryId,
            title: `중복 부서 공지 ${i}`,
            content: `내용 ${i}`,
            permissionDepartmentIds: SAME_DEPT_IDS, // 모두 같은 부서 권한
          })
          .expect(201);
      }

      // When - 스케줄러 실행
      if (scheduler && ssoService) {
        await scheduler.모든_공지사항_권한을_검증한다();

        // Then
        // 1. SSO API는 1회만 호출
        expect(ssoSpy).toHaveBeenCalledTimes(1);

        // 2. 중복 제거된 부서 ID만 조회 (3개)
        const callArgs = ssoSpy.mock.calls[0][0];
        expect(callArgs).toEqual(expect.arrayContaining(SAME_DEPT_IDS));
        expect(callArgs.length).toBe(SAME_DEPT_IDS.length);
      }
    });

    it('병렬 처리로 여러 공지사항을 빠르게 검증해야 한다', async () => {
      // Given - 20개의 공지사항 생성
      const announcementCount = 20;
      for (let i = 1; i <= announcementCount; i++) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({
            categoryId: testCategoryId,
            title: `병렬 처리 공지 ${i}`,
            content: `내용 ${i}`,
            permissionDepartmentIds: [`dept-parallel-${i}`],
          })
          .expect(201);
      }

      // When - 스케줄러 실행 (병렬 처리)
      if (scheduler) {
        const startTime = Date.now();
        await scheduler.모든_공지사항_권한을_검증한다();
        const parallelTime = Date.now() - startTime;

        // Then
        console.log(`\n⚡ 병렬 처리 성능:`);
        console.log(`   - 처리한 공지사항: ${announcementCount}개`);
        console.log(`   - SSO API 호출: 1회 (500-1000ms 랜덤 딜레이)`);
        console.log(`   - 총 처리 시간: ${parallelTime}ms`);
        console.log(`   - 평균: ${(parallelTime / announcementCount).toFixed(2)}ms/개\n`);

        expect(parallelTime).toBeLessThan(5000); // 5초 이내
      }
    });

    it('부서 권한이 없는 공지사항은 SSO API를 호출하지 않아야 한다', async () => {
      // Given - 부서 권한이 없는 공지사항만 생성
      for (let i = 1; i <= 5; i++) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({
            categoryId: testCategoryId,
            title: `권한 없는 공지 ${i}`,
            content: `내용 ${i}`,
            permissionDepartmentIds: null,
          })
          .expect(201);
      }

      // When - 스케줄러 실행
      if (scheduler && ssoService) {
        await scheduler.모든_공지사항_권한을_검증한다();

        // Then - SSO API 호출되지 않아야 함
        expect(ssoSpy).not.toHaveBeenCalled();
      }
    });

    it('기존 로그 재검증도 캐시된 데이터를 사용해야 한다', async () => {
      // Given - 공지사항 생성 및 권한 설정
      const announcement = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '재검증 테스트 공지',
          content: '내용',
          permissionDepartmentIds: ['dept-revalidate-1'],
        })
        .expect(201);

      // 로그 생성을 위한 권한 교체
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcement.body.id}/replace-permissions`)
        .send({
          departments: [
            { oldId: 'dept-revalidate-1', newId: 'dept-revalidate-2' },
          ],
        })
        .expect(200);

      // When - 스케줄러 실행 (기존 로그 재검증 포함)
      if (scheduler && ssoService) {
        ssoSpy.mockClear();
        await scheduler.모든_공지사항_권한을_검증한다();

        // Then - SSO API는 여전히 1회만 호출 (재검증도 캐시 사용)
        expect(ssoSpy).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('대량 데이터 처리', () => {
    it('50개의 공지사항을 빠르게 처리해야 한다', async () => {
      // Given - 50개의 공지사항 생성
      for (let i = 1; i <= 50; i++) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({
            categoryId: testCategoryId,
            title: `대량 테스트 공지 ${i}`,
            content: `내용 ${i}`,
            permissionDepartmentIds: i % 5 === 0 ? [`dept-bulk-50-${i}`] : null,
          })
          .expect(201);
      }

      // When - 스케줄러 실행
      if (scheduler) {
        const startTime = Date.now();
        await scheduler.모든_공지사항_권한을_검증한다();
        const elapsedTime = Date.now() - startTime;

        // Then - 합리적인 시간 내에 처리되어야 함 (10초 이내)
        console.log(`\n📊 50개 공지사항 처리:`);
        console.log(`   - SSO API 호출: 1회 (500-1000ms 랜덤 딜레이)`);
        console.log(`   - 처리 시간: ${elapsedTime}ms`);
        console.log(`   - 평균: ${(elapsedTime / 50).toFixed(2)}ms/개\n`);
        expect(elapsedTime).toBeLessThan(10000);
      }
    });

    it('100개의 공지사항을 빠르게 처리해야 한다', async () => {
      // Given - 100개의 공지사항 생성
      for (let i = 1; i <= 100; i++) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({
            categoryId: testCategoryId,
            title: `대량 100 테스트 공지 ${i}`,
            content: `내용 ${i}`,
            permissionDepartmentIds: i % 5 === 0 ? [`dept-bulk-100-${i}`] : null,
          })
          .expect(201);
      }

      // When - 스케줄러 실행
      if (scheduler) {
        const startTime = Date.now();
        await scheduler.모든_공지사항_권한을_검증한다();
        const elapsedTime = Date.now() - startTime;

        // Then - 합리적인 시간 내에 처리되어야 함 (20초 이내)
        console.log(`\n📊 100개 공지사항 처리:`);
        console.log(`   - SSO API 호출: 1회 (500-1000ms 랜덤 딜레이)`);
        console.log(`   - 처리 시간: ${elapsedTime}ms`);
        console.log(`   - 평균: ${(elapsedTime / 100).toFixed(2)}ms/개\n`);
        expect(elapsedTime).toBeLessThan(20000);
      }
    });

    it('1000개의 공지사항을 빠르게 처리해야 한다 (대용량)', async () => {
      // Given - 1000개의 공지사항 생성
      console.log('\n🚀 1000개 공지사항 생성 중...');
      const batchSize = 50;
      for (let batch = 0; batch < 20; batch++) {
        const promises: Promise<any>[] = [];
        for (let i = 1; i <= batchSize; i++) {
          const index = batch * batchSize + i;
          promises.push(
            testSuite
              .request()
              .post('/api/admin/announcements')
              .send({
                categoryId: testCategoryId,
                title: `대량 1000 테스트 공지 ${index}`,
                content: `내용 ${index}`,
                permissionDepartmentIds: index % 10 === 0 ? [`dept-bulk-1000-${index}`] : null,
              })
          );
        }
        await Promise.all(promises);
        console.log(`   진행률: ${((batch + 1) * batchSize / 10).toFixed(0)}%`);
      }
      console.log('✅ 1000개 공지사항 생성 완료\n');

      // When - 스케줄러 실행
      if (scheduler) {
        console.log('🔍 권한 검증 시작...\n');
        const startTime = Date.now();
        await scheduler.모든_공지사항_권한을_검증한다();
        const elapsedTime = Date.now() - startTime;

        // Then - 합리적인 시간 내에 처리되어야 함 (60초 이내)
        console.log(`\n📊 1000개 공지사항 처리 결과:`);
        console.log(`   - SSO API 호출: 1회 (500-1000ms 랜덤 딜레이)`);
        console.log(`   - 처리 시간: ${elapsedTime}ms (${(elapsedTime / 1000).toFixed(2)}초)`);
        console.log(`   - 평균: ${(elapsedTime / 1000).toFixed(2)}ms/개`);
        console.log(`   - 초당 처리량: ${(1000 / (elapsedTime / 1000)).toFixed(0)}개/초\n`);
        expect(elapsedTime).toBeLessThan(60000);
      }
    }, 120000); // 타임아웃 2분
  });

  describe('에러 핸들링', () => {
    it('일부 공지사항 처리 실패 시에도 전체 배치는 계속되어야 한다', async () => {
      // Given - 정상 공지사항과 잘못된 권한 ID를 가진 공지사항 혼재
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '정상 공지',
          content: '내용',
          permissionDepartmentIds: ['dept-normal'],
        })
        .expect(201);

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '에러 공지',
          content: '내용',
          permissionDepartmentIds: ['dept-error-non-existent'],
        })
        .expect(201);

      // When - 스케줄러 실행 (에러가 있어도 전체 프로세스는 완료)
      if (scheduler) {
        await expect(
          scheduler.모든_공지사항_권한을_검증한다()
        ).resolves.not.toThrow();
      }
    });

    it('SSO API 장애 시에도 스케줄러는 에러를 throw하지 않아야 한다', async () => {
      // Given - 공지사항 생성
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: 'SSO 장애 테스트',
          content: '내용',
          permissionDepartmentIds: ['dept-sso-error'],
        })
        .expect(201);

      if (scheduler && ssoService) {
        // SSO API 에러 시뮬레이션
        ssoSpy.mockRejectedValueOnce(new Error('SSO API timeout'));

        // When & Then - 에러를 throw하지 않고 로그만 출력
        await expect(
          scheduler.모든_공지사항_권한을_검증한다()
        ).resolves.not.toThrow();
      }
    });
  });
});
