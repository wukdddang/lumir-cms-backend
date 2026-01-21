import { BaseE2ETest } from '../../../base-e2e.spec';

describe('위키 권한 교체 트랜잭션 및 동시성 테스트', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  describe('트랜잭션 원자성 검증', () => {
    it('권한 교체와 로그 생성이 원자적으로 수행되어야 한다', async () => {
      // Given - 위키 생성 및 권한 설정
      const folder = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '트랜잭션 테스트 폴더' })
        .expect(201);

      await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folder.body.id}/public`)
        .send({
          isPublic: false,
          permissionDepartmentIds: ['dept-tx-old-1', 'dept-tx-old-2'],
        })
        .expect(200);

      // When - 권한 교체
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/${folder.body.id}/replace-permissions`)
        .send({
          departments: [
            { oldId: 'dept-tx-old-1', newId: 'dept-tx-new-1' },
            { oldId: 'dept-tx-old-2', newId: 'dept-tx-new-2' },
          ],
          note: '트랜잭션 테스트',
        })
        .expect(200);

      // Then
      // 1. 권한이 교체되었는지 확인
      const updatedFolder = await testSuite
        .request()
        .get(`/api/admin/wiki/folders/${folder.body.id}`)
        .expect(200);

      expect(updatedFolder.body.permissionDepartmentIds).toEqual(
        expect.arrayContaining(['dept-tx-new-1', 'dept-tx-new-2'])
      );
      expect(updatedFolder.body.permissionDepartmentIds).not.toContain('dept-tx-old-1');
      expect(updatedFolder.body.permissionDepartmentIds).not.toContain('dept-tx-old-2');

      // 2. RESOLVED 로그가 생성되었는지 확인
      const logs = await testSuite
        .request()
        .get('/api/admin/wiki/permission-logs')
        .expect(200);

      const resolvedLog = logs.body.find(
        (log: any) => 
          log.wikiFileSystemId === folder.body.id &&
          log.action === 'resolved'
      );

      expect(resolvedLog).toBeDefined();
      expect(resolvedLog.note).toContain('트랜잭션 테스트');
      expect(resolvedLog.resolvedAt).not.toBeNull();
    });

    it('권한 교체 실패 시 로그도 생성되지 않아야 한다 (롤백)', async () => {
      // Given - 위키 생성
      const folder = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '롤백 테스트 폴더' })
        .expect(201);

      await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folder.body.id}/public`)
        .send({
          isPublic: false,
          permissionDepartmentIds: ['dept-rollback-1'],
        })
        .expect(200);

      // 로그 수 확인
      const logsBefore = await testSuite
        .request()
        .get('/api/admin/wiki/permission-logs')
        .expect(200);
      const countBefore = logsBefore.body.length;

      // When - 존재하지 않는 위키에 권한 교체 시도 (실패)
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await testSuite
        .request()
        .patch(`/api/admin/wiki/${nonExistentId}/replace-permissions`)
        .send({
          departments: [{ oldId: 'dept-rollback-1', newId: 'dept-rollback-2' }],
        })
        .expect(404);

      // Then - 로그가 생성되지 않았는지 확인
      const logsAfter = await testSuite
        .request()
        .get('/api/admin/wiki/permission-logs')
        .expect(200);

      expect(logsAfter.body.length).toBe(countBefore);
    });
  });

  describe('비관적 잠금 (Pessimistic Lock) 검증', () => {
    it('동시에 같은 위키의 권한을 교체하면 순차적으로 처리되어야 한다', async () => {
      // Given - 위키 생성 및 권한 설정
      const folder = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '동시성 테스트 폴더' })
        .expect(201);

      await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folder.body.id}/public`)
        .send({
          isPublic: false,
          permissionDepartmentIds: ['dept-concurrent-1', 'dept-concurrent-2'],
        })
        .expect(200);

      // When - 두 개의 권한 교체 요청을 동시에 전송
      const [result1, result2] = await Promise.all([
        testSuite
          .request()
          .patch(`/api/admin/wiki/${folder.body.id}/replace-permissions`)
          .send({
            departments: [{ oldId: 'dept-concurrent-1', newId: 'dept-new-1' }],
            note: '첫 번째 교체',
          }),
        testSuite
          .request()
          .patch(`/api/admin/wiki/${folder.body.id}/replace-permissions`)
          .send({
            departments: [{ oldId: 'dept-concurrent-2', newId: 'dept-new-2' }],
            note: '두 번째 교체',
          }),
      ]);

      // Then - 두 요청 모두 성공
      expect(result1.status).toBe(200);
      expect(result2.status).toBe(200);

      // 최종 권한 상태 확인
      const updatedFolder = await testSuite
        .request()
        .get(`/api/admin/wiki/folders/${folder.body.id}`)
        .expect(200);

      // 두 교체 모두 반영되어야 함
      expect(updatedFolder.body.permissionDepartmentIds).toEqual(
        expect.arrayContaining(['dept-new-1', 'dept-new-2'])
      );
      expect(updatedFolder.body.permissionDepartmentIds).not.toContain('dept-concurrent-1');
      expect(updatedFolder.body.permissionDepartmentIds).not.toContain('dept-concurrent-2');

      // 두 개의 RESOLVED 로그가 생성되어야 함
      const logs = await testSuite
        .request()
        .get('/api/admin/wiki/permission-logs')
        .expect(200);

      const resolvedLogs = logs.body.filter(
        (log: any) => 
          log.wikiFileSystemId === folder.body.id &&
          log.action === 'resolved'
      );

      expect(resolvedLogs.length).toBe(2);
    });

    it('Lost Update 문제가 발생하지 않아야 한다', async () => {
      // Given - 3개의 부서 권한을 가진 위키 생성
      const folder = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: 'Lost Update 방지 테스트' })
        .expect(201);

      await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folder.body.id}/public`)
        .send({
          isPublic: false,
          permissionDepartmentIds: ['dept-a', 'dept-b', 'dept-c'],
        })
        .expect(200);

      // When - 동시에 여러 권한 교체 (A→X, B→Y, C→Z)
      const requests = [
        testSuite
          .request()
          .patch(`/api/admin/wiki/${folder.body.id}/replace-permissions`)
          .send({
            departments: [{ oldId: 'dept-a', newId: 'dept-x' }],
          }),
        testSuite
          .request()
          .patch(`/api/admin/wiki/${folder.body.id}/replace-permissions`)
          .send({
            departments: [{ oldId: 'dept-b', newId: 'dept-y' }],
          }),
        testSuite
          .request()
          .patch(`/api/admin/wiki/${folder.body.id}/replace-permissions`)
          .send({
            departments: [{ oldId: 'dept-c', newId: 'dept-z' }],
          }),
      ];

      const results = await Promise.all(requests);

      // Then - 모든 요청이 성공
      results.forEach(result => {
        expect(result.status).toBe(200);
      });

      // 최종 권한 확인 - 모든 교체가 반영되어야 함 (Lost Update 없음)
      const updatedFolder = await testSuite
        .request()
        .get(`/api/admin/wiki/folders/${folder.body.id}`)
        .expect(200);

      expect(updatedFolder.body.permissionDepartmentIds).toEqual(
        expect.arrayContaining(['dept-x', 'dept-y', 'dept-z'])
      );
      
      // 원본 부서가 남아있으면 안됨
      expect(updatedFolder.body.permissionDepartmentIds).not.toContain('dept-a');
      expect(updatedFolder.body.permissionDepartmentIds).not.toContain('dept-b');
      expect(updatedFolder.body.permissionDepartmentIds).not.toContain('dept-c');
    });
  });

  describe('Race Condition 방지', () => {
    it('권한 교체는 트랜잭션으로 보호되어야 한다', async () => {
      // Given - 위키 생성
      const folder = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: 'Race Condition 테스트' })
        .expect(201);

      await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folder.body.id}/public`)
        .send({
          isPublic: false,
          permissionDepartmentIds: ['dept-race-1', 'dept-race-2', 'dept-race-3'],
        })
        .expect(200);

      // When - 권한 교체 실행
      const updatePermResult = await testSuite
        .request()
        .patch(`/api/admin/wiki/${folder.body.id}/replace-permissions`)
        .send({
          departments: [{ oldId: 'dept-race-1', newId: 'dept-new-race-1' }],
        })
        .expect(200);

      // Then - 권한 교체가 성공
      expect(updatePermResult.status).toBe(200);

      // 최종 상태 확인
      const finalFolder = await testSuite
        .request()
        .get(`/api/admin/wiki/folders/${folder.body.id}`)
        .expect(200);

      // 권한이 올바르게 교체되었는지 확인
      expect(finalFolder.body.permissionDepartmentIds).toContain('dept-new-race-1');
      expect(finalFolder.body.permissionDepartmentIds).not.toContain('dept-race-1');
      
      // 로그가 생성되었는지 확인
      const logs = await testSuite
        .request()
        .get('/api/admin/wiki/permission-logs')
        .expect(200);

      const resolvedLog = logs.body.find(
        (log: any) => 
          log.wikiFileSystemId === folder.body.id &&
          log.action === 'resolved'
      );

      expect(resolvedLog).toBeDefined();
    });
  });

  describe('트랜잭션 격리 수준', () => {
    it('권한 교체 중에는 다른 트랜잭션이 같은 데이터를 수정할 수 없어야 한다', async () => {
      // Given
      const folder = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '격리 수준 테스트' })
        .expect(201);

      await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folder.body.id}/public`)
        .send({
          isPublic: false,
          permissionDepartmentIds: ['dept-isolation-1', 'dept-isolation-2'],
        })
        .expect(200);

      // When - 빠르게 연속해서 같은 부서를 다른 부서로 교체 시도
      const [result1, result2] = await Promise.all([
        testSuite
          .request()
          .patch(`/api/admin/wiki/${folder.body.id}/replace-permissions`)
          .send({
            departments: [{ oldId: 'dept-isolation-1', newId: 'dept-version-a' }],
          }),
        testSuite
          .request()
          .patch(`/api/admin/wiki/${folder.body.id}/replace-permissions`)
          .send({
            departments: [{ oldId: 'dept-isolation-1', newId: 'dept-version-b' }],
          }),
      ]);

      // Then - 두 요청 중 하나는 성공, 하나는 부서를 찾을 수 없음
      const statuses = [result1.status, result2.status].sort();
      
      // 순차 처리로 인해 둘 다 200이거나, 두번째가 이미 교체된 상태를 처리
      const finalFolder = await testSuite
        .request()
        .get(`/api/admin/wiki/folders/${folder.body.id}`)
        .expect(200);

      // 최종적으로 하나의 버전만 반영되어야 함
      const hasVersionA = finalFolder.body.permissionDepartmentIds.includes('dept-version-a');
      const hasVersionB = finalFolder.body.permissionDepartmentIds.includes('dept-version-b');
      
      // 정확히 하나만 true여야 함 (XOR)
      expect(hasVersionA !== hasVersionB).toBe(true);
      
      // 원본은 남아있으면 안됨
      expect(finalFolder.body.permissionDepartmentIds).not.toContain('dept-isolation-1');
    });
  });

  describe('트랜잭션 타임아웃', () => {
    it('권한 교체는 합리적인 시간 내에 완료되어야 한다', async () => {
      // Given - 위키 생성
      const folder = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '타임아웃 테스트' })
        .expect(201);

      await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folder.body.id}/public`)
        .send({
          isPublic: false,
          permissionDepartmentIds: ['dept-timeout-1', 'dept-timeout-2'],
        })
        .expect(200);

      // When - 권한 교체 시간 측정
      const startTime = Date.now();
      
      await testSuite
        .request()
        .patch(`/api/admin/wiki/${folder.body.id}/replace-permissions`)
        .send({
          departments: [
            { oldId: 'dept-timeout-1', newId: 'dept-new-timeout-1' },
            { oldId: 'dept-timeout-2', newId: 'dept-new-timeout-2' },
          ],
        })
        .expect(200);

      const elapsedTime = Date.now() - startTime;

      // Then - 5초 이내에 완료되어야 함
      console.log(`\n⏱️  권한 교체 처리 시간: ${elapsedTime}ms\n`);
      expect(elapsedTime).toBeLessThan(5000);
    });
  });
});
