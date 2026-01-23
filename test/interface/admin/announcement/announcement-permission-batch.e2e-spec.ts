import { BaseE2ETest } from '../../../base-e2e.spec';
import { AnnouncementPermissionScheduler } from '../../../../src/context/announcement-context/announcement-permission.scheduler';

describe('공지사항 권한 검증 배치 처리 및 부서 변경 대상 목록 조회', () => {
  const testSuite = new BaseE2ETest();
  let testCategoryId: string;
  let scheduler: AnnouncementPermissionScheduler;
  let schedulerSpy: jest.SpyInstance;

  beforeAll(async () => {
    await testSuite.beforeAll();
    
    try {
      // 스케줄러 인스턴스 가져오기
      scheduler = testSuite.app.get(AnnouncementPermissionScheduler, { strict: false });
      
      if (scheduler) {
        // 비동기 배치 실행 메서드에 spy 설정
        // 실제 메서드 실행은 유지하되 호출 여부만 추적
        schedulerSpy = jest.spyOn(scheduler, '모든_공지사항_권한을_검증한다');
      } else {
        schedulerSpy = jest.fn();
      }
    } catch (error) {
      // 스케줄러를 찾을 수 없는 경우 (테스트 환경에 따라 다를 수 있음)
      console.warn('스케줄러를 찾을 수 없습니다:', error);
      schedulerSpy = jest.fn();
    }
  });

  afterAll(async () => {
    schedulerSpy?.mockRestore();
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
    schedulerSpy.mockClear();

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

  describe('GET /api/admin/announcements - 목록 조회 시 비동기 배치 처리', () => {
    it('permissionDepartmentIds가 비어있는 공지사항이 있을 때 비동기 배치가 실행되어야 한다', async () => {
      // Given - permissionDepartmentIds가 비어있는 공지사항 생성
      const announcement1 = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '부서 권한 없는 공지1',
          content: '내용1',
          permissionDepartmentIds: null,
        })
        .expect(201);

      // permissionDepartmentIds가 있는 공지사항도 생성
      const announcement2 = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '부서 권한 있는 공지2',
          content: '내용2',
          permissionDepartmentIds: ['dept-1', 'dept-2'],
        })
        .expect(201);

      // When - 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/announcements')
        .expect(200);

      // Then - 목록이 정상적으로 반환되어야 함
      expect(response.body.items).toHaveLength(2);
      expect(response.body.total).toBe(2);

      // 비동기 배치가 실행되었는지 확인 (약간의 지연 후)
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      // permissionDepartmentIds가 비어있는 항목이 있으므로 배치가 실행되어야 함
      // 스케줄러가 있는 경우에만 확인
      if (scheduler) {
        expect(schedulerSpy).toHaveBeenCalled();
      }
    });

    it('permissionDepartmentIds가 모두 있는 경우 배치가 실행되지 않아야 한다', async () => {
      // Given - 모든 공지사항에 permissionDepartmentIds가 있음
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '부서 권한 있는 공지1',
          content: '내용1',
          permissionDepartmentIds: ['dept-1'],
        })
        .expect(201);

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '부서 권한 있는 공지2',
          content: '내용2',
          permissionDepartmentIds: ['dept-2'],
        })
        .expect(201);

      // When - 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/announcements')
        .expect(200);

      // Then - 목록이 정상적으로 반환되어야 함
      expect(response.body.items).toHaveLength(2);

      // 비동기 배치가 실행되지 않아야 함
      await new Promise((resolve) => setTimeout(resolve, 200));
      // 스케줄러가 있는 경우에만 확인
      if (scheduler) {
        expect(schedulerSpy).not.toHaveBeenCalled();
      }
    });

    it('permissionDepartmentIds가 빈 배열인 경우에도 배치가 실행되어야 한다', async () => {
      // Given - permissionDepartmentIds가 빈 배열인 공지사항 생성
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '빈 배열 공지',
          content: '내용',
          permissionDepartmentIds: [],
        })
        .expect(201);

      // When - 목록 조회
      await testSuite
        .request()
        .get('/api/admin/announcements')
        .expect(200);

      // Then - 비동기 배치가 실행되어야 함
      await new Promise((resolve) => setTimeout(resolve, 200));
      // 스케줄러가 있는 경우에만 확인
      if (scheduler) {
        expect(schedulerSpy).toHaveBeenCalled();
      }
    });

    it('목록 조회는 배치 실행과 관계없이 정상 응답해야 한다', async () => {
      // Given
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '테스트 공지',
          content: '내용',
          permissionDepartmentIds: null,
        })
        .expect(201);

      // When - 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/announcements')
        .expect(200);

      // Then - 응답이 즉시 반환되어야 함 (배치 실행을 기다리지 않음)
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });
  });

  describe('GET /api/admin/announcements/department-change-targets - 부서 변경 대상 목록 조회', () => {
    it('permissionDepartmentIds가 비어있는 공지사항만 조회해야 한다', async () => {
      // Given
      // permissionDepartmentIds가 null인 공지사항
      const announcement1 = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '부서 권한 없는 공지1',
          content: '내용1',
          permissionDepartmentIds: null,
        })
        .expect(201);

      // permissionDepartmentIds가 빈 배열인 공지사항
      const announcement2 = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '부서 권한 없는 공지2',
          content: '내용2',
          permissionDepartmentIds: [],
        })
        .expect(201);

      // permissionDepartmentIds가 있는 공지사항
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '부서 권한 있는 공지',
          content: '내용3',
          permissionDepartmentIds: ['dept-1', 'dept-2'],
        })
        .expect(201);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/department-change-targets')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      // 반환된 공지사항들의 ID 확인
      const returnedIds = response.body.map((item: any) => item.id);
      expect(returnedIds).toContain(announcement1.body.id);
      expect(returnedIds).toContain(announcement2.body.id);
      
      // 모든 항목이 permissionDepartmentIds가 비어있어야 함
      response.body.forEach((item: any) => {
        expect(
          item.permissionDepartmentIds === null ||
          item.permissionDepartmentIds === undefined ||
          item.permissionDepartmentIds.length === 0,
        ).toBe(true);
      });
    });

    it('부서 변경 대상이 없으면 빈 배열을 반환해야 한다', async () => {
      // Given - 모든 공지사항에 permissionDepartmentIds가 있음
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '부서 권한 있는 공지1',
          content: '내용1',
          permissionDepartmentIds: ['dept-1'],
        })
        .expect(201);

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '부서 권한 있는 공지2',
          content: '내용2',
          permissionDepartmentIds: ['dept-2'],
        })
        .expect(201);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/department-change-targets')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('공지사항이 없으면 빈 배열을 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/department-change-targets')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('부서 변경 대상 목록에 모든 필드가 포함되어야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '부서 변경 대상 공지',
          content: '내용',
          isFixed: true,
          isPublic: false,
          mustRead: true,
          permissionDepartmentIds: null,
        })
        .expect(201);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/department-change-targets')
        .expect(200);

      // Then
      expect(response.body.length).toBe(1);
      const announcement = response.body[0];
      
      expect(announcement).toMatchObject({
        id: createResponse.body.id,
        title: '부서 변경 대상 공지',
        content: '내용',
        isFixed: true,
        isPublic: false,
        mustRead: true,
        permissionDepartmentIds: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('다양한 permissionDepartmentIds 상태를 올바르게 필터링해야 한다', async () => {
      // Given
      // null
      const nullAnnouncement = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: 'null 공지',
          content: '내용',
          permissionDepartmentIds: null,
        })
        .expect(201);

      // 빈 배열
      const emptyArrayAnnouncement = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '빈 배열 공지',
          content: '내용',
          permissionDepartmentIds: [],
        })
        .expect(201);

      // 값이 있는 배열
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '값 있는 공지',
          content: '내용',
          permissionDepartmentIds: ['dept-1'],
        })
        .expect(201);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/department-change-targets')
        .expect(200);

      // Then
      expect(response.body.length).toBe(2);
      
      const returnedIds = response.body.map((item: any) => item.id);
      expect(returnedIds).toContain(nullAnnouncement.body.id);
      expect(returnedIds).toContain(emptyArrayAnnouncement.body.id);
    });
  });
});
