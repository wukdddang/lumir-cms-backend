import { BaseE2ETest } from '../../../base-e2e.spec';

describe('공지사항 카테고리 API', () => {
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

  // NOTE: 카테고리 API 라우팅 순서 문제가 수정되었습니다.
  // GET '/api/admin/announcements/categories'가 GET '/api/admin/announcements/:id'보다 앞에 위치합니다.
  
  describe('GET /api/admin/announcements/categories (카테고리 목록 조회)', () => {
    it('빈 목록을 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/categories')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: [],
        total: 0,
      });
    });

    it('등록된 카테고리 목록을 조회해야 한다', async () => {
      // Given
      const categories = [
        { name: '인사', description: '인사 관련 공지' },
        { name: '총무', description: '총무 관련 공지' },
        { name: '경영', description: '경영 관련 공지' },
      ];

      for (const category of categories) {
        await testSuite
          .request()
          .post('/api/admin/announcements/categories')
          .send(category);
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/categories')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(3);
      expect(response.body.total).toBe(3);
      expect(response.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: '인사' }),
          expect.objectContaining({ name: '총무' }),
          expect.objectContaining({ name: '경영' }),
        ]),
      );
    });
  });

  describe('POST /api/admin/announcements/categories (카테고리 생성)', () => {
    it('카테고리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '인사',
        description: '인사 관련 공지사항',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements/categories')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: '인사',
        description: '인사 관련 공지사항',
        order: expect.any(Number),
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('설명 없이 카테고리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '총무',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements/categories')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: '총무',
      });
    });

    it('순서를 지정하여 카테고리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '긴급',
        description: '긴급 공지',
        order: 1,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements/categories')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: '긴급',
        order: 1,
      });
    });

    it('name이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        description: '설명만 있음',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements/categories')
        .send(createDto)
        .expect(400);
    });
  });

  describe('PATCH /api/admin/announcements/categories/:id (카테고리 수정)', () => {
    it('카테고리 이름을 수정해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements/categories')
        .send({ name: '원본 이름', description: '원본 설명' });

      const categoryId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/announcements/categories/${categoryId}`)
        .send({ name: '수정된 이름' })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: categoryId,
        name: '수정된 이름',
      });
      // description은 응답에 포함될 수도, 안 될 수도 있음
    });

    it('카테고리 설명을 수정해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements/categories')
        .send({ name: '인사', description: '원본 설명' });

      const categoryId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/announcements/categories/${categoryId}`)
        .send({ description: '수정된 설명' })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: categoryId,
        description: '수정된 설명',
      });
      // name은 응답에 포함될 수도, 안 될 수도 있음
    });

    it('카테고리 활성화 상태를 수정해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements/categories')
        .send({ name: '인사' });

      const categoryId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/announcements/categories/${categoryId}`)
        .send({ isActive: false })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: categoryId,
        isActive: false,
      });
    });

    it('존재하지 않는 ID로 수정 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/announcements/categories/${nonExistentId}`)
        .send({ name: '수정된 이름' })
        .expect(404);
    });
  });

  describe('PATCH /api/admin/announcements/categories/:id/order (카테고리 순서 변경)', () => {
    it('카테고리 순서를 변경해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements/categories')
        .send({ name: '인사', order: 0 });

      const categoryId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/announcements/categories/${categoryId}/order`)
        .send({ order: 5 })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: categoryId,
        order: 5,
      });
    });

    it('order가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements/categories')
        .send({ name: '인사' });

      const categoryId = createResponse.body.id;

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/announcements/categories/${categoryId}/order`)
        .send({})
        .expect(400);
    });

    it('존재하지 않는 ID로 순서 변경 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/announcements/categories/${nonExistentId}/order`)
        .send({ order: 5 })
        .expect(404);
    });
  });

  describe('DELETE /api/admin/announcements/categories/:id (카테고리 삭제)', () => {
    it('카테고리를 삭제해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements/categories')
        .send({ name: '삭제할 카테고리' });

      const categoryId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .delete(`/api/admin/announcements/categories/${categoryId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
      });

      // 삭제 확인
      const listResponse = await testSuite
        .request()
        .get('/api/admin/announcements/categories')
        .expect(200);

      expect(listResponse.body.items.find((item: any) => item.id === categoryId)).toBeUndefined();
    });

    it('여러 카테고리를 삭제해야 한다', async () => {
      // Given
      const ids: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/announcements/categories')
          .send({ name: `카테고리${i}` });
        ids.push(response.body.id);
      }

      // When & Then
      for (const id of ids) {
        await testSuite
          .request()
          .delete(`/api/admin/announcements/categories/${id}`)
          .expect(200);
      }

      // 모두 삭제되었는지 확인
      const listResponse = await testSuite
        .request()
        .get('/api/admin/announcements/categories')
        .expect(200);

      expect(listResponse.body.total).toBe(0);
    });

    it('존재하지 않는 ID로 삭제 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .delete(`/api/admin/announcements/categories/${nonExistentId}`)
        .expect(404);
    });
  });
});
