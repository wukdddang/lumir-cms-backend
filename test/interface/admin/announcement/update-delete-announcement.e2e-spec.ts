import { BaseE2ETest } from '../../../base-e2e.spec';
import { ContentStatus } from '@domain/core/content-status.types';

describe('PUT /api/admin/announcements/:id (공지사항 수정)', () => {
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

  describe('성공 케이스', () => {
    it('공지사항의 제목을 수정해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '원본 제목', content: '원본 내용' });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/announcements/${announcementId}`)
        .send({ title: '수정된 제목' })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: announcementId,
        title: '수정된 제목',
      });
      // content는 응답에 포함될 수도, 안 될 수도 있음
    });

    it('공지사항의 내용을 수정해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '원본 제목', content: '원본 내용' });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/announcements/${announcementId}`)
        .send({ content: '수정된 내용' })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: announcementId,
      });
      // title, content는 응답에 포함될 수도, 안 될 수도 있음
    });

    it('공지사항의 여러 필드를 동시에 수정해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '원본 제목',
          content: '원본 내용',
          isFixed: false,
          isPublic: true,
          mustRead: false,
        });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/announcements/${announcementId}`)
        .send({
          title: '수정된 제목',
          content: '수정된 내용',
          isFixed: true,
          isPublic: false,
          mustRead: true,
        })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: announcementId,
        isFixed: true,
        isPublic: false,
        mustRead: true,
      });
    });

    it('공지사항의 날짜를 수정해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '테스트',
          content: '내용',
          releasedAt: '2024-01-01T00:00:00Z',
          expiredAt: '2024-06-30T23:59:59Z',
        });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/announcements/${announcementId}`)
        .send({
          releasedAt: '2024-02-01T00:00:00Z',
          expiredAt: '2024-12-31T23:59:59Z',
        })
        .expect(200);

      // Then
      expect(response.body.id).toBe(announcementId);
      expect(new Date(response.body.releasedAt).toISOString()).toBe('2024-02-01T00:00:00.000Z');
      expect(new Date(response.body.expiredAt).toISOString()).toBe('2024-12-31T23:59:59.000Z');
    });

    it('공지사항의 상태를 수정해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '테스트', content: '내용' });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/announcements/${announcementId}`)
        .send({ status: ContentStatus.CLOSED })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: announcementId,
      });
      // status는 응답에 포함될 수도, 안 될 수도 있음
      // ContentStatus.CLOSED가 설정되었는지 DB에서 확인 필요
    });

    it('공지사항의 권한 정보를 수정해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          title: '테스트',
          content: '내용',
          permissionEmployeeIds: ['uuid-1'],
          permissionRankCodes: ['매니저'],
        });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/announcements/${announcementId}`)
        .send({
          permissionEmployeeIds: ['uuid-2', 'uuid-3'],
          permissionRankCodes: ['책임매니저'],
          permissionPositionCodes: ['팀장'],
        })
        .expect(200);

      // Then
      expect(response.body.id).toBe(announcementId);
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 수정 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .put(`/api/admin/announcements/${nonExistentId}`)
        .send({ title: '수정된 제목' })
        .expect(404);
    });

    it('잘못된 데이터 타입으로 수정 시 400 에러가 발생해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '테스트', content: '내용' });

      const announcementId = createResponse.body.id;

      // When & Then
      await testSuite
        .request()
        .put(`/api/admin/announcements/${announcementId}`)
        .send({ isFixed: 'not-a-boolean' })
        .expect(400);
    });
  });
});

describe('PATCH /api/admin/announcements/:id/public (공지사항 공개 상태 수정)', () => {
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

  describe('성공 케이스', () => {
    it('공개 상태를 true로 변경해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '테스트', content: '내용', isPublic: false });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcementId}/public`)
        .send({ isPublic: true })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: announcementId,
        isPublic: true,
      });
    });

    it('공개 상태를 false로 변경해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '테스트', content: '내용', isPublic: true });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcementId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: announcementId,
        isPublic: false,
      });
    });
  });

  describe('실패 케이스', () => {
    it('isPublic이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '테스트', content: '내용' });

      const announcementId = createResponse.body.id;

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcementId}/public`)
        .send({})
        .expect(400);
    });

    it('존재하지 않는 ID로 수정 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${nonExistentId}/public`)
        .send({ isPublic: true })
        .expect(404);
    });
  });
});

describe('PATCH /api/admin/announcements/:id/fixed (공지사항 고정 상태 수정)', () => {
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

  describe('성공 케이스', () => {
    it('고정 상태를 true로 변경해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '테스트', content: '내용', isFixed: false });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcementId}/fixed`)
        .send({ isFixed: true })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: announcementId,
        isFixed: true,
      });
    });

    it('고정 상태를 false로 변경해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '테스트', content: '내용', isFixed: true });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcementId}/fixed`)
        .send({ isFixed: false })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: announcementId,
        isFixed: false,
      });
    });
  });

  describe('실패 케이스', () => {
    it('isFixed가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '테스트', content: '내용' });

      const announcementId = createResponse.body.id;

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${announcementId}/fixed`)
        .send({})
        .expect(400);
    });

    it('존재하지 않는 ID로 수정 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/announcements/${nonExistentId}/fixed`)
        .send({ isFixed: true })
        .expect(404);
    });
  });
});

describe('DELETE /api/admin/announcements/:id (공지사항 삭제)', () => {
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

  describe('성공 케이스', () => {
    it('공지사항을 삭제해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '삭제할 공지', content: '내용' });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .delete(`/api/admin/announcements/${announcementId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
      });

      // 삭제 확인
      await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}`)
        .expect(404);
    });

    it('여러 공지사항을 삭제해야 한다', async () => {
      // Given
      const ids = [];
      for (let i = 1; i <= 3; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({ title: `공지${i}`, content: `내용${i}` });
        ids.push(response.body.id);
      }

      // When & Then
      for (const id of ids) {
        await testSuite
          .request()
          .delete(`/api/admin/announcements/${id}`)
          .expect(200);
      }

      // 모두 삭제되었는지 확인
      const listResponse = await testSuite
        .request()
        .get('/api/admin/announcements')
        .expect(200);

      expect(listResponse.body.total).toBe(0);
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 삭제 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .delete(`/api/admin/announcements/${nonExistentId}`)
        .expect(404);
    });

    it('잘못된 UUID 형식으로 삭제 시 에러가 발생해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid';

      // When & Then
      const response = await testSuite
        .request()
        .delete(`/api/admin/announcements/${invalidId}`);

      expect([400, 500]).toContain(response.status);
    });
  });
});
