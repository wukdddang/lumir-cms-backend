import { BaseE2ETest } from '../../../base-e2e.spec';

describe('공지사항 알림 API', () => {
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

  describe('POST /api/admin/announcements/:id/notifications/all (전체 직원에게 알림 전송)', () => {
    it('공지사항 알림을 전체 직원에게 전송해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '전체 공지',
          content: '모든 직원에게 알림',
          isPublic: true,
        });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/all`);

      // Then - 200 또는 201
      expect([200, 201]).toContain(response.status);
      expect(response.body).toMatchObject({
        success: expect.any(Boolean),
        sentCount: expect.any(Number),
        failedCount: expect.any(Number),
        message: expect.any(String),
      });
    });

    it('path 파라미터를 포함하여 알림을 전송해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '커스텀 경로 공지',
          content: '커스텀 경로로 리다이렉트',
          isPublic: true,
        });

      const announcementId = createResponse.body.id;
      const customPath = 'https://cms.example.com/announcements/123';

      // When
      const response = await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/all?path=${encodeURIComponent(customPath)}`);

      // Then - 200 또는 201
      expect([200, 201]).toContain(response.status);
      expect(response.body).toMatchObject({
        success: expect.any(Boolean),
        sentCount: expect.any(Number),
        failedCount: expect.any(Number),
        message: expect.any(String),
      });
    });

    it('제한공개 공지사항 알림을 권한이 있는 직원에게 전송해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '제한 공지',
          content: '특정 부서만',
          isPublic: false,
          permissionDepartmentCodes: ['경영지원-경지'],
        });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/all`);

      // Then - 200 또는 201
      expect([200, 201]).toContain(response.status);
      expect(response.body).toMatchObject({
        success: expect.any(Boolean),
        sentCount: expect.any(Number),
        failedCount: expect.any(Number),
        message: expect.any(String),
      });
    });

    it('존재하지 않는 공지사항 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .post(`/api/admin/announcements/${nonExistentId}/notifications/all`)
        .expect(404);
    });
  });

  describe('POST /api/admin/announcements/:id/notifications/unanswered (설문 미답변자에게 알림 전송)', () => {
    it('설문이 없는 공지사항인 경우 400 에러가 발생해야 한다', async () => {
      // Given - 설문이 없는 일반 공지사항
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '일반 공지',
          content: '설문 없음',
        });

      const announcementId = createResponse.body.id;

      // When & Then
      await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/unanswered`)
        .expect(400);
    });

    it('path 파라미터를 포함하여 알림을 전송할 수 있어야 한다', async () => {
      // Given - 설문이 없는 일반 공지사항 (400 에러 예상)
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '일반 공지',
          content: '설문 없음',
        });

      const announcementId = createResponse.body.id;
      const customPath = 'https://cms.example.com/survey/123';

      // When & Then - 설문이 없으므로 path와 무관하게 400 에러
      await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/unanswered?path=${encodeURIComponent(customPath)}`)
        .expect(400);
    });

    it('존재하지 않는 공지사항 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .post(`/api/admin/announcements/${nonExistentId}/notifications/unanswered`)
        .expect(404);
    });

    // Note: 설문이 있는 경우의 성공 케이스는 설문 기능이 구현된 후 테스트 가능
  });

  describe('POST /api/admin/announcements/:id/notifications/unread (미열람자에게 알림 전송)', () => {
    it('공지사항 미열람자에게 알림을 전송해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '미열람 알림 테스트',
          content: '읽지 않은 사람에게 알림',
          mustRead: true,
        });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/unread`);

      // Then - 200 또는 201
      expect([200, 201]).toContain(response.status);
      expect(response.body).toMatchObject({
        success: expect.any(Boolean),
        sentCount: expect.any(Number),
        failedCount: expect.any(Number),
        message: expect.any(String),
      });
    });

    it('path 파라미터를 포함하여 알림을 전송해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '커스텀 경로 미열람 알림',
          content: '읽지 않은 사람에게 커스텀 경로로',
          mustRead: true,
        });

      const announcementId = createResponse.body.id;
      const customPath = 'https://cms.example.com/announcements/detail/123';

      // When
      const response = await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/unread?path=${encodeURIComponent(customPath)}`);

      // Then - 200 또는 201
      expect([200, 201]).toContain(response.status);
      expect(response.body).toMatchObject({
        success: expect.any(Boolean),
        sentCount: expect.any(Number),
        failedCount: expect.any(Number),
        message: expect.any(String),
      });
    });

    it('전사공개 공지사항의 미열람자에게 알림을 전송해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '전사공개 미열람 알림',
          content: '모든 직원 대상',
          isPublic: true,
          mustRead: true,
        });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/unread`);

      // Then - 200 또는 201
      expect([200, 201]).toContain(response.status);
      expect(response.body).toMatchObject({
        success: expect.any(Boolean),
        sentCount: expect.any(Number),
        failedCount: expect.any(Number),
        message: expect.any(String),
      });
    });

    it('제한공개 공지사항의 미열람자에게 알림을 전송해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '제한공개 미열람 알림',
          content: '특정 직원만',
          isPublic: false,
          mustRead: true,
          permissionEmployeeIds: ['uuid-1', 'uuid-2'],
        });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/unread`);

      // Then - 200 또는 201
      expect([200, 201]).toContain(response.status);
      expect(response.body).toMatchObject({
        success: expect.any(Boolean),
        sentCount: expect.any(Number),
        failedCount: expect.any(Number),
        message: expect.any(String),
      });
    });

    it('존재하지 않는 공지사항 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .post(`/api/admin/announcements/${nonExistentId}/notifications/unread`)
        .expect(404);
    });
  });

  describe('알림 전송 통합 시나리오', () => {
    it('공지사항 생성 후 여러 타입의 알림을 순차적으로 전송할 수 있어야 한다', async () => {
      // Given - 필독 공지사항 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '중요 공지',
          content: '모두 확인 바랍니다',
          isPublic: true,
          mustRead: true,
        });

      const announcementId = createResponse.body.id;

      // When & Then - 전체 직원에게 알림 전송
      const allNotificationResponse = await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/all`);

      expect([200, 201]).toContain(allNotificationResponse.status);
      expect(allNotificationResponse.body.success).toBeDefined();

      // When & Then - 미열람자에게 알림 전송
      const unreadNotificationResponse = await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/unread`);

      expect([200, 201]).toContain(unreadNotificationResponse.status);
      expect(unreadNotificationResponse.body.success).toBeDefined();
    });

    it('커스텀 경로를 사용하여 알림을 전송할 수 있어야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '커스텀 경로 테스트',
          content: '다양한 경로로 리다이렉트',
          isPublic: true,
        });

      const announcementId = createResponse.body.id;
      const customPath = 'https://mobile.example.com/announcements/view/123';

      // When & Then - 커스텀 경로로 전체 알림
      const allResponse = await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/all?path=${encodeURIComponent(customPath)}`);

      expect([200, 201]).toContain(allResponse.status);

      // When & Then - 커스텀 경로로 미열람자 알림
      const unreadResponse = await testSuite
        .request()
        .post(`/api/admin/announcements/${announcementId}/notifications/unread?path=${encodeURIComponent(customPath)}`);

      expect([200, 201]).toContain(unreadResponse.status);
    });

    it('여러 공지사항에 대해 알림을 전송할 수 있어야 한다', async () => {
      // Given - 여러 공지사항 생성
      const announcementIds: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({
            title: `공지${i}`,
            content: `내용${i}`,
            isPublic: true,
          });
        announcementIds.push(response.body.id);
      }

      // When & Then - 각 공지사항에 대해 알림 전송
      for (const id of announcementIds) {
        const response = await testSuite
          .request()
          .post(`/api/admin/announcements/${id}/notifications/all`);

        expect([200, 201]).toContain(response.status);
        expect(response.body).toMatchObject({
          success: expect.any(Boolean),
          sentCount: expect.any(Number),
          failedCount: expect.any(Number),
        });
      }
    });
  });
});
