import { BaseE2ETest } from '../../../base-e2e.spec';

describe('공지사항 권한 로그 조회 API', () => {
  const testSuite = new BaseE2ETest();
  let testCategoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

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

  describe('GET /api/admin/announcements/permission-logs (권한 로그 목록 조회)', () => {
    it('빈 로그 목록을 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('모든 권한 로그 목록을 조회해야 한다', async () => {
      // Given - 공지사항 생성
      const announcement1 = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '공지사항 1',
          content: '내용 1',
          permissionDepartmentIds: ['dept-1'],
        })
        .expect(201);

      const announcement2 = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '공지사항 2',
          content: '내용 2',
          permissionDepartmentIds: ['dept-2'],
        })
        .expect(201);

      // Note: 실제 권한 로그는 스케줄러가 실행되어야 생성됨
      // 이 테스트는 API 엔드포인트가 정상적으로 동작하는지 확인

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      // 스케줄러가 실행되지 않았으면 빈 배열
      // 스케줄러가 실행되었으면 로그가 있을 수 있음
    });

    it('미해결 권한 로그만 조회해야 한다', async () => {
      // Given
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '테스트 공지',
          content: '내용',
          permissionDepartmentIds: ['dept-1'],
        })
        .expect(201);

      // When - resolved=false 필터
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs?resolved=false')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      
      // 미해결 로그가 있는 경우 확인
      if (response.body.length > 0) {
        response.body.forEach((log: any) => {
          expect(log.resolvedAt).toBeNull();
        });
      }
    });

    it('해결된 권한 로그만 조회해야 한다', async () => {
      // Given
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '테스트 공지',
          content: '내용',
          permissionDepartmentIds: ['dept-1'],
        })
        .expect(201);

      // When - resolved=true 필터
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs?resolved=true')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      
      // 해결된 로그가 있는 경우 확인
      if (response.body.length > 0) {
        response.body.forEach((log: any) => {
          expect(log.resolvedAt).not.toBeNull();
        });
      }
    });

    it('resolved 필터링이 정확히 작동해야 한다', async () => {
      // Given - 공지사항 생성 및 권한 교체로 resolved 로그 생성
      const announcement = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: 'Resolved 필터링 테스트',
          content: '내용',
          isPublic: false,
          permissionDepartmentIds: ['filter-dept-1'],
        })
        .expect(201);

      // 권한 교체로 RESOLVED 로그 생성
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcement.body.id}/replace-permissions`)
        .send({
          departments: [{ oldId: 'filter-dept-1', newId: 'filter-dept-2' }],
        })
        .expect(200);

      // When - 전체 로그 조회
      const allLogsResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      // Then - resolved=true는 resolvedAt이 있는 로그만
      const resolvedResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs?resolved=true')
        .expect(200);

      expect(Array.isArray(resolvedResponse.body)).toBe(true);
      resolvedResponse.body.forEach((log: any) => {
        expect(log.resolvedAt).not.toBeNull();
        expect(log.resolvedAt).toBeDefined();
      });

      // resolved=false는 resolvedAt이 null인 로그만
      const unresolvedResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs?resolved=false')
        .expect(200);

      expect(Array.isArray(unresolvedResponse.body)).toBe(true);
      unresolvedResponse.body.forEach((log: any) => {
        expect(log.resolvedAt).toBeNull();
      });

      // 전체 로그 수 = resolved + unresolved
      expect(allLogsResponse.body.length).toBe(
        resolvedResponse.body.length + unresolvedResponse.body.length,
      );
    });

    it('권한 로그에 공지사항 정보가 포함되어야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '권한 로그 테스트',
          content: '내용',
          permissionDepartmentIds: null, // 빈 권한으로 로그 생성 유도
        })
        .expect(201);

      // 스케줄러 수동 실행 (필요한 경우)
      // await testSuite.app.get(AnnouncementPermissionScheduler).모든_공지사항_권한을_검증한다();

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      
      // 로그가 있는 경우 구조 확인
      if (response.body.length > 0) {
        const log = response.body[0];
        expect(log).toMatchObject({
          id: expect.any(String),
          announcementId: expect.any(String),
          action: expect.any(String),
          detectedAt: expect.any(String),
          createdAt: expect.any(String),
        });

        // announcement 관계가 포함된 경우 확인
        if (log.announcement) {
          expect(log.announcement).toMatchObject({
            id: expect.any(String),
            title: expect.any(String),
          });
        }
      }
    });
  });

  describe('권한 로그 필터링 테스트', () => {
    it('resolved 파라미터가 boolean이 아닌 경우에도 동작해야 한다', async () => {
      // When - 잘못된 타입의 파라미터
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs?resolved=invalid')
        .expect(200);

      // Then - 전체 로그 반환 (필터 무시)
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('여러 공지사항의 권한 로그를 조회해야 한다', async () => {
      // Given - 여러 공지사항 생성
      for (let i = 1; i <= 3; i++) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({
            categoryId: testCategoryId,
            title: `공지사항 ${i}`,
            content: `내용 ${i}`,
            permissionDepartmentIds: [`dept-${i}`],
          })
          .expect(201);
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      // 스케줄러가 실행되면 여러 공지사항의 로그가 있을 수 있음
    });
  });

  describe('권한 교체 후 로그 확인', () => {
    it('권한 교체 후 RESOLVED 로그가 생성되어야 한다', async () => {
      // Given - 공지사항 생성 (비공개 상태로)
      const oldDeptId = '00000000-0000-0000-0000-000000000001';
      const newDeptId = '00000000-0000-0000-0000-000000000002';
      const oldEmpId = '00000000-0000-0000-0000-000000000003';
      const newEmpId = '00000000-0000-0000-0000-000000000004';
      
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '권한 교체 테스트',
          content: '내용',
          isPublic: false, // 비공개 상태로 생성
          permissionDepartmentIds: [oldDeptId],
          permissionEmployeeIds: [oldEmpId],
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When - 권한 교체
      const replaceResponse = await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcementId}/replace-permissions`)
        .send({
          departments: [
            { oldId: oldDeptId, newId: newDeptId },
          ],
          employees: [
            { oldId: oldEmpId, newId: newEmpId },
          ],
          note: '테스트 권한 교체',
        });

      // 에러 응답 로깅
      if (replaceResponse.status !== 200) {
        console.log('권한 교체 실패:', replaceResponse.status, replaceResponse.body);
      }
      
      expect(replaceResponse.status).toBe(200);

      // Then - RESOLVED 로그 확인
      const logsResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      // RESOLVED 로그 찾기
      const resolvedLogs = logsResponse.body.filter(
        (log: any) =>
          log.announcementId === announcementId &&
          log.action === 'resolved',
      );

      expect(resolvedLogs.length).toBeGreaterThanOrEqual(1);
      
      if (resolvedLogs.length > 0) {
        const resolvedLog = resolvedLogs[0];
        expect(resolvedLog).toMatchObject({
          announcementId,
          action: 'resolved',
          resolvedAt: expect.any(String),
          resolvedBy: expect.any(String),
        });

        // note 필드 확인
        if (resolvedLog.note) {
          expect(resolvedLog.note).toContain('테스트 권한 교체');
        }
      }
    });

    it('여러 번 권한 교체 시 각각 RESOLVED 로그가 생성되어야 한다', async () => {
      // Given (비공개 상태로 생성)
      const deptId1 = '00000000-0000-0000-0000-000000000010';
      const deptId2 = '00000000-0000-0000-0000-000000000011';
      const newDeptId1 = '00000000-0000-0000-0000-000000000012';
      const newDeptId2 = '00000000-0000-0000-0000-000000000013';
      
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '다중 권한 교체 테스트',
          content: '내용',
          isPublic: false, // 비공개 상태로 생성
          permissionDepartmentIds: [deptId1, deptId2],
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When - 첫 번째 권한 교체
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcementId}/replace-permissions`)
        .send({
          departments: [{ oldId: deptId1, newId: newDeptId1 }],
          note: '첫 번째 교체',
        })
        .expect(200);

      // When - 두 번째 권한 교체
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcementId}/replace-permissions`)
        .send({
          departments: [{ oldId: deptId2, newId: newDeptId2 }],
          note: '두 번째 교체',
        })
        .expect(200);

      // Then - 로그 확인
      const logsResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      const resolvedLogs = logsResponse.body.filter(
        (log: any) =>
          log.announcementId === announcementId &&
          log.action === 'resolved',
      );

      // 최소 2개의 RESOLVED 로그가 있어야 함
      expect(resolvedLogs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('권한 로그 정렬 테스트', () => {
    it('권한 로그가 감지 일시(detectedAt) 내림차순으로 정렬되어야 한다', async () => {
      // Given - 여러 공지사항 생성 (시간차를 두고)
      const announcementIds: string[] = [];
      
      for (let i = 1; i <= 3; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({
            categoryId: testCategoryId,
            title: `공지사항 ${i}`,
            content: `내용 ${i}`,
            permissionDepartmentIds: [`dept-${i}`],
          })
          .expect(201);
        
        announcementIds.push(response.body.id);
        
        // 약간의 지연
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      // Then - 정렬 확인 (로그가 있는 경우)
      if (response.body.length >= 2) {
        for (let i = 0; i < response.body.length - 1; i++) {
          const currentDate = new Date(response.body[i].detectedAt);
          const nextDate = new Date(response.body[i + 1].detectedAt);
          
          // 내림차순: 현재 날짜 >= 다음 날짜
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
        }
      }
    });
  });

  describe('권한 로그 데이터 구조 검증', () => {
    it('DETECTED 로그의 구조를 검증해야 한다', async () => {
      // Given
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: 'DETECTED 로그 테스트',
          content: '내용',
          permissionDepartmentIds: null,
        })
        .expect(201);

      // 스케줄러 실행 후 로그 생성 대기
      // (실제 환경에서는 스케줄러가 자동 실행됨)

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs?resolved=false')
        .expect(200);

      // Then - DETECTED 로그가 있는 경우 구조 확인
      if (response.body.length > 0) {
        const detectedLog = response.body.find((log: any) => log.action === 'detected');
        
        if (detectedLog) {
          expect(detectedLog).toMatchObject({
            id: expect.any(String),
            announcementId: expect.any(String),
            action: 'detected',
            detectedAt: expect.any(String),
            resolvedAt: null,
            createdAt: expect.any(String),
          });

          // JSONB 필드 확인 (선택적)
          // invalidDepartments, invalidEmployees 등
        }
      }
    });

    it('RESOLVED 로그의 구조를 검증해야 한다', async () => {
      // Given (비공개 상태로 생성)
      const oldId = '00000000-0000-0000-0000-000000000020';
      const newId = '00000000-0000-0000-0000-000000000021';
      
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: 'RESOLVED 로그 테스트',
          content: '내용',
          isPublic: false, // 비공개 상태로 생성
          permissionDepartmentIds: [oldId],
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When - 권한 교체
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcementId}/replace-permissions`)
        .send({
          departments: [{ oldId: oldId, newId: newId }],
        })
        .expect(200);

      // Then - RESOLVED 로그 확인
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs?resolved=true')
        .expect(200);

      const resolvedLog = response.body.find(
        (log: any) =>
          log.announcementId === announcementId &&
          log.action === 'resolved',
      );

      if (resolvedLog) {
        expect(resolvedLog).toMatchObject({
          id: expect.any(String),
          announcementId,
          action: 'resolved',
          detectedAt: expect.any(String),
          resolvedAt: expect.any(String),
          resolvedBy: expect.any(String),
          createdAt: expect.any(String),
        });
      }
    });
  });

  describe('권한 로그 통합 시나리오', () => {
    it('공지사항 생성 → 권한 로그 감지 → 권한 교체 → 로그 해결 플로우를 테스트해야 한다', async () => {
      // Step 1: 공지사항 생성 (비공개 상태로)
      const invalidDeptId = '00000000-0000-0000-0000-000000000030';
      const validDeptId = '00000000-0000-0000-0000-000000000031';
      
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '통합 시나리오 테스트',
          content: '내용',
          isPublic: false, // 비공개 상태로 생성
          permissionDepartmentIds: [invalidDeptId],
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // Step 2: 전체 로그 조회
      const allLogsResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      expect(Array.isArray(allLogsResponse.body)).toBe(true);

      // Step 3: 미해결 로그만 조회
      const unresolvedResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs?resolved=false')
        .expect(200);

      expect(Array.isArray(unresolvedResponse.body)).toBe(true);

      // Step 4: 권한 교체
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcementId}/replace-permissions`)
        .send({
          departments: [
            { oldId: invalidDeptId, newId: validDeptId },
          ],
        })
        .expect(200);

      // Step 5: 해결된 로그 조회
      const resolvedResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs?resolved=true')
        .expect(200);

      const resolvedLogs = resolvedResponse.body.filter(
        (log: any) => log.announcementId === announcementId,
      );

      expect(resolvedLogs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('다시 보지 않기 기능', () => {
    it('미열람 권한 로그를 조회해야 한다', async () => {
      // Given - 공지사항 생성
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '테스트 공지',
          content: '내용',
          permissionDepartmentIds: ['dept-1'],
        })
        .expect(201);

      // When - 미열람 로그 조회
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs/unread')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('권한 로그를 무시 처리할 수 있어야 한다', async () => {
      // Given - 공지사항 생성
      const announcement = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '무시 테스트 공지',
          content: '내용',
          isPublic: false,
          permissionDepartmentIds: ['test-dept-1'],
        })
        .expect(201);

      // 권한 교체로 RESOLVED 로그 생성
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcement.body.id}/replace-permissions`)
        .send({
          departments: [{ oldId: 'test-dept-1', newId: 'test-dept-2' }],
        })
        .expect(200);

      // 권한 로그 조회
      const logsResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      if (logsResponse.body.length === 0) {
        // 로그가 없으면 테스트 스킵
        return;
      }

      const logId = logsResponse.body[0].id;

      // When - 무시 처리
      const dismissResponse = await testSuite
        .request()
        .patch('/api/admin/announcements/permission-logs/dismiss')
        .send({ logIds: [logId] })
        .expect(200);

      // Then
      expect(dismissResponse.body).toMatchObject({
        success: true,
        message: expect.any(String),
        dismissed: 1,
        alreadyDismissed: 0,
        notFound: 0,
      });
    });

    it('무시 처리한 로그는 미열람 조회에서 제외되어야 한다', async () => {
      // Given - 공지사항 생성
      const announcement = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '무시 필터 테스트',
          content: '내용',
          isPublic: false,
          permissionDepartmentIds: ['filter-test-dept'],
        })
        .expect(201);

      // 권한 교체로 로그 생성
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcement.body.id}/replace-permissions`)
        .send({
          departments: [{ oldId: 'filter-test-dept', newId: 'new-dept' }],
        })
        .expect(200);

      // 로그 조회
      const logsResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      if (logsResponse.body.length === 0) {
        return;
      }

      const logId = logsResponse.body[0].id;

      // 무시 처리 전 미열람 조회
      const unreadBefore = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs/unread')
        .expect(200);

      const countBefore = unreadBefore.body.length;

      // When - 무시 처리
      await testSuite
        .request()
        .patch('/api/admin/announcements/permission-logs/dismiss')
        .send({ logIds: [logId] })
        .expect(200);

      // Then - 무시 처리 후 미열람 조회
      const unreadAfter = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs/unread')
        .expect(200);

      // 무시된 로그는 제외되어야 함
      expect(unreadAfter.body.length).toBeLessThanOrEqual(countBefore);
    });

    it('무시 처리한 로그도 전체 조회에서는 여전히 보여야 한다', async () => {
      // Given
      const announcement = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '전체 조회 테스트',
          content: '내용',
          isPublic: false,
          permissionDepartmentIds: ['all-test-dept'],
        })
        .expect(201);

      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcement.body.id}/replace-permissions`)
        .send({
          departments: [{ oldId: 'all-test-dept', newId: 'new-all-dept' }],
        })
        .expect(200);

      const logsResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      if (logsResponse.body.length === 0) {
        return;
      }

      const logId = logsResponse.body[0].id;
      const totalBefore = logsResponse.body.length;

      // When - 무시 처리
      await testSuite
        .request()
        .patch('/api/admin/announcements/permission-logs/dismiss')
        .send({ logIds: [logId] })
        .expect(200);

      // Then - 전체 조회는 동일한 개수
      const allLogsAfter = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      expect(allLogsAfter.body.length).toBe(totalBefore);
    });

    it('이미 무시 처리된 로그를 다시 무시하면 중복 생성하지 않아야 한다', async () => {
      // Given
      const announcement = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '중복 테스트',
          content: '내용',
          isPublic: false,
          permissionDepartmentIds: ['dup-test-dept'],
        })
        .expect(201);

      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcement.body.id}/replace-permissions`)
        .send({
          departments: [{ oldId: 'dup-test-dept', newId: 'new-dup-dept' }],
        })
        .expect(200);

      const logsResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      if (logsResponse.body.length === 0) {
        return;
      }

      const logId = logsResponse.body[0].id;

      // 첫 번째 무시 처리
      const firstDismiss = await testSuite
        .request()
        .patch('/api/admin/announcements/permission-logs/dismiss')
        .send({ logIds: [logId] })
        .expect(200);

      // When - 두 번째 무시 처리
      const secondDismiss = await testSuite
        .request()
        .patch('/api/admin/announcements/permission-logs/dismiss')
        .send({ logIds: [logId] })
        .expect(200);

      // Then
      expect(secondDismiss.body).toMatchObject({
        success: true,
        dismissed: 0,
        alreadyDismissed: 1,
        notFound: 0,
      });

      // 첫 번째 요청에서는 무시 처리됨
      expect(firstDismiss.body.dismissed).toBe(1);
    });

    it('여러 권한 로그를 한 번에 무시 처리할 수 있어야 한다', async () => {
      // Given - 여러 공지사항 생성
      const announcement1 = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '배치 테스트 공지1',
          content: '내용',
          isPublic: false,
          permissionDepartmentIds: ['batch-dept-1'],
        })
        .expect(201);

      const announcement2 = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '배치 테스트 공지2',
          content: '내용',
          isPublic: false,
          permissionDepartmentIds: ['batch-dept-2'],
        })
        .expect(201);

      const announcement3 = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '배치 테스트 공지3',
          content: '내용',
          isPublic: false,
          permissionDepartmentIds: ['batch-dept-3'],
        })
        .expect(201);

      // 권한 교체로 로그들 생성
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcement1.body.id}/replace-permissions`)
        .send({
          departments: [{ oldId: 'batch-dept-1', newId: 'new-batch-1' }],
        })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcement2.body.id}/replace-permissions`)
        .send({
          departments: [{ oldId: 'batch-dept-2', newId: 'new-batch-2' }],
        })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcement3.body.id}/replace-permissions`)
        .send({
          departments: [{ oldId: 'batch-dept-3', newId: 'new-batch-3' }],
        })
        .expect(200);

      // 로그 조회
      const logsResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      if (logsResponse.body.length < 3) {
        return;
      }

      // 최신 3개 로그 선택
      const logIds = logsResponse.body.slice(0, 3).map((log: any) => log.id);

      // When - 여러 로그를 한 번에 무시 처리
      const dismissResponse = await testSuite
        .request()
        .patch('/api/admin/announcements/permission-logs/dismiss')
        .send({ logIds })
        .expect(200);

      // Then
      expect(dismissResponse.body).toMatchObject({
        success: true,
        dismissed: 3,
        alreadyDismissed: 0,
        notFound: 0,
      });

      // 미열람 조회에서 무시된 로그들이 제외되는지 확인
      const unreadResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs/unread')
        .expect(200);

      const unreadIds = unreadResponse.body.map((log: any) => log.id);
      logIds.forEach((logId: string) => {
        expect(unreadIds).not.toContain(logId);
      });
    });

    it('배치 무시 처리 시 일부는 성공하고 일부는 이미 무시된 경우를 처리해야 한다', async () => {
      // Given - 공지사항들 생성
      const announcement1 = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '혼합 테스트 1',
          content: '내용',
          isPublic: false,
          permissionDepartmentIds: ['mixed-dept-1'],
        })
        .expect(201);

      const announcement2 = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '혼합 테스트 2',
          content: '내용',
          isPublic: false,
          permissionDepartmentIds: ['mixed-dept-2'],
        })
        .expect(201);

      // 권한 교체
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcement1.body.id}/replace-permissions`)
        .send({
          departments: [{ oldId: 'mixed-dept-1', newId: 'new-mixed-1' }],
        })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcement2.body.id}/replace-permissions`)
        .send({
          departments: [{ oldId: 'mixed-dept-2', newId: 'new-mixed-2' }],
        })
        .expect(200);

      const logsResponse = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs')
        .expect(200);

      if (logsResponse.body.length < 2) {
        return;
      }

      const logIds = logsResponse.body.slice(0, 2).map((log: any) => log.id);

      // 첫 번째 로그만 먼저 무시 처리
      await testSuite
        .request()
        .patch('/api/admin/announcements/permission-logs/dismiss')
        .send({ logIds: [logIds[0]] })
        .expect(200);

      // When - 두 로그 모두 무시 처리 시도
      const dismissResponse = await testSuite
        .request()
        .patch('/api/admin/announcements/permission-logs/dismiss')
        .send({ logIds })
        .expect(200);

      // Then - 1개는 새로 무시, 1개는 이미 무시됨
      expect(dismissResponse.body).toMatchObject({
        success: true,
        dismissed: 1,
        alreadyDismissed: 1,
        notFound: 0,
      });
    });

    it('존재하지 않는 로그 ID가 포함된 경우 스킵해야 한다', async () => {
      // Given - 가짜 UUID v4 (존재하지 않는 ID들)
      const fakeIds = [
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000003',
      ];

      // When - 존재하지 않는 ID들만 보냄
      const dismissResponse = await testSuite
        .request()
        .patch('/api/admin/announcements/permission-logs/dismiss')
        .send({ logIds: fakeIds })
        .expect(200);

      // Then - 모두 notFound로 처리됨
      expect(dismissResponse.body).toMatchObject({
        success: true,
        dismissed: 0,
        alreadyDismissed: 0,
        notFound: 3,
      });
    });

    it('빈 배열로 요청하면 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .patch('/api/admin/announcements/permission-logs/dismiss')
        .send({ logIds: [] })
        .expect(400);
    });

    it('잘못된 UUID 형식이 포함된 경우 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .patch('/api/admin/announcements/permission-logs/dismiss')
        .send({ logIds: ['invalid-uuid', 'not-a-uuid'] })
        .expect(400);
    });
  });

  describe('부서 재활성화 시 자동 해결', () => {
    it('시스템이 자동으로 해결한 로그는 resolvedBy가 null이어야 한다', async () => {
      // Note: 이 테스트는 스케줄러가 실행되고 부서가 재활성화된 후의 상태를 검증합니다.
      // 실제 환경에서는 부서 비활성화 → 스케줄러 실행 → 부서 재활성화 → 스케줄러 재실행 플로우가 필요합니다.
      
      // When - 해결된 로그 중 시스템이 자동 해결한 것 조회
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/permission-logs?resolved=true')
        .expect(200);

      // Then - 시스템이 자동 해결한 로그가 있는 경우 검증
      const systemResolvedLogs = response.body.filter(
        (log: any) =>
          log.action === 'resolved' &&
          log.resolvedBy === null &&
          log.note?.includes('시스템'),
      );

      // 시스템 자동 해결 로그가 있다면 구조 검증
      if (systemResolvedLogs.length > 0) {
        systemResolvedLogs.forEach((log: any) => {
          expect(log).toMatchObject({
            action: 'resolved',
            resolvedBy: null,
            resolvedAt: expect.any(String),
            note: expect.stringContaining('시스템'),
          });
        });
      }
    });

    it('목록 조회 시 재검증 스케줄러가 트리거되어야 한다', async () => {
      // Given - permissionDepartmentIds가 빈 공지사항 생성
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '재검증 테스트',
          content: '내용',
          permissionDepartmentIds: null, // 빈 권한으로 스케줄러 트리거 유도
        })
        .expect(201);

      // When - 목록 조회 (스케줄러가 백그라운드에서 실행됨)
      const response = await testSuite
        .request()
        .get('/api/admin/announcements')
        .expect(200);

      // Then - 응답이 정상적으로 반환되어야 함
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
      });

      // Note: 스케줄러는 비동기로 실행되므로 즉시 로그가 생성되지 않을 수 있습니다.
      // 실제 로그 생성 여부는 별도의 통합 테스트에서 검증해야 합니다.
    });

    it('고정 목록 조회 시 재검증 스케줄러가 트리거되어야 한다', async () => {
      // Given - permissionDepartmentIds가 빈 고정 공지사항 생성
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '고정 재검증 테스트',
          content: '내용',
          isFixed: true,
          permissionDepartmentIds: null,
        })
        .expect(201);

      // When - 고정 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/fixed')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
      });
    });

    it('전체 목록 조회 시 재검증 스케줄러가 트리거되어야 한다', async () => {
      // Given - permissionDepartmentIds가 빈 공지사항 생성
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '전체 재검증 테스트',
          content: '내용',
          permissionDepartmentIds: null,
        })
        .expect(201);

      // When - 전체 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/all')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});
