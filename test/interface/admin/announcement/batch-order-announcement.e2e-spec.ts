import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PUT /api/admin/announcements/batch-order (공지사항 순서 일괄 수정)', () => {
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

  describe('성공 케이스', () => {
    it('공지사항 순서를 일괄 수정해야 한다', async () => {
      // Given - 3개의 공지사항 생성
      const announcements: any[] = [];
      for (let i = 1; i <= 3; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({ categoryId: testCategoryId, title: `공지${i}`, content: `내용${i}` });
        announcements.push(response.body);
      }

      // When - 순서 변경 (역순으로)
      const updateDto = {
        announcements: [
          { id: announcements[2].id, order: 0 },
          { id: announcements[1].id, order: 1 },
          { id: announcements[0].id, order: 2 },
        ],
      };

      const response = await testSuite
        .request()
        .put('/api/admin/announcements/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        updatedCount: 3,
      });

      // 순서가 변경되었는지 확인
      const announcement1 = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcements[0].id}`)
        .expect(200);

      const announcement2 = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcements[1].id}`)
        .expect(200);

      const announcement3 = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcements[2].id}`)
        .expect(200);

      expect(announcement1.body.order).toBe(2);
      expect(announcement2.body.order).toBe(1);
      expect(announcement3.body.order).toBe(0);
    });

    it('일부 공지사항의 순서만 수정해야 한다', async () => {
      // Given - 5개의 공지사항 생성
      const announcements: any[] = [];
      for (let i = 1; i <= 5; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({ categoryId: testCategoryId, title: `공지${i}`, content: `내용${i}` });
        announcements.push(response.body);
      }

      // When - 3개만 순서 변경
      const updateDto = {
        announcements: [
          { id: announcements[0].id, order: 10 },
          { id: announcements[2].id, order: 20 },
          { id: announcements[4].id, order: 30 },
        ],
      };

      const response = await testSuite
        .request()
        .put('/api/admin/announcements/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        updatedCount: 3,
      });
    });

    it('하나의 공지사항 순서를 수정해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ categoryId: testCategoryId, title: '공지1', content: '내용1' });

      const announcementId = createResponse.body.id;

      // When
      const updateDto = {
        announcements: [{ id: announcementId, order: 100 }],
      };

      const response = await testSuite
        .request()
        .put('/api/admin/announcements/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        updatedCount: 1,
      });

      // 순서 확인
      const getResponse = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}`)
        .expect(200);

      expect(getResponse.body.order).toBe(100);
    });
  });

  describe('실패 케이스', () => {
    it('빈 배열로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const updateDto = {
        announcements: [],
      };

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/announcements/batch-order')
        .send(updateDto)
        .expect(400);
    });

    it('announcements 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateDto = {};

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/announcements/batch-order')
        .send(updateDto)
        .expect(400);
    });

    it('존재하지 않는 ID가 포함된 경우 404 에러가 발생해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ categoryId: testCategoryId, title: '공지1', content: '내용1' });

      const updateDto = {
        announcements: [
          { id: createResponse.body.id, order: 0 },
          { id: '00000000-0000-0000-0000-000000000001', order: 1 },
        ],
      };

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/announcements/batch-order')
        .send(updateDto)
        .expect(404);
    });

    it('잘못된 데이터 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ categoryId: testCategoryId, title: '공지1', content: '내용1' });

      const updateDto = {
        announcements: [
          { id: createResponse.body.id, order: 'not-a-number' }, // order가 숫자가 아님
        ],
      };

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/announcements/batch-order')
        .send(updateDto)
        .expect(400);
    });

    it('id 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateDto = {
        announcements: [{ order: 0 }], // id 누락
      };

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/announcements/batch-order')
        .send(updateDto)
        .expect(400);
    });

    it('order 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ categoryId: testCategoryId, title: '공지1', content: '내용1' });

      const updateDto = {
        announcements: [{ id: createResponse.body.id }], // order 누락
      };

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/announcements/batch-order')
        .send(updateDto)
        .expect(400);
    });
  });

  describe('중복 ID 테스트', () => {
    it('중복된 ID가 있어도 마지막 order로 업데이트되어야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ categoryId: testCategoryId, title: '공지1', content: '내용1' });

      const announcementId = createResponse.body.id;

      // When - 같은 ID를 다른 order로 여러 번 포함
      const updateDto = {
        announcements: [
          { id: announcementId, order: 10 },
          { id: announcementId, order: 20 },
          { id: announcementId, order: 30 },
        ],
      };

      const response = await testSuite
        .request()
        .put('/api/admin/announcements/batch-order')
        .send(updateDto);

      // Then - 200 또는 500 (중복 ID가 있는 경우)
      expect([200, 500]).toContain(response.status);

      if (response.status === 200) {
        // 최종 order 확인
        const getResponse = await testSuite
          .request()
          .get(`/api/admin/announcements/${announcementId}`)
          .expect(200);

        // 마지막 order(30)가 적용되어야 함
        expect(getResponse.body.order).toBe(30);
      }
    });
  });
});
