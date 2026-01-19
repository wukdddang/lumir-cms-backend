import { BaseE2ETest } from '../../../base-e2e.spec';

describe('주주총회 카테고리 (E2E)', () => {
  const testSuite = new BaseE2ETest();
  let categoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  describe('GET /api/admin/shareholders-meetings/categories - 카테고리 목록 조회', () => {
    it('카테고리 목록을 조회할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings/categories')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
      });
    });

    it('생성된 카테고리가 목록에 포함되어야 한다', async () => {
      // Given - 카테고리 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings/categories')
        .send({
          name: '정기총회',
          description: '정기 주주총회',
          isActive: true,
          order: 0,
        })
        .expect(201);

      const createdId = createResponse.body.id;

      // When - 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings/categories')
        .expect(200);

      // Then
      const found = response.body.items.find((c: any) => c.id === createdId);
      expect(found).toBeDefined();
      expect(found.name).toBe('정기총회');
    });
  });

  describe('POST /api/admin/shareholders-meetings/categories - 카테고리 생성', () => {
    it('유효한 데이터로 카테고리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '정기총회',
        description: '정기 주주총회 카테고리',
        isActive: true,
        order: 0,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings/categories')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: '정기총회',
        description: '정기 주주총회 카테고리',
        isActive: true,
        order: 0,
        entityType: 'shareholders_meeting',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      categoryId = response.body.id;
    });

    it('description 없이 카테고리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '임시총회',
        isActive: true,
        order: 1,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings/categories')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.name).toBe('임시총회');
      expect(response.body.description).toBeNull();
    });

    it('isActive가 false인 카테고리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '비활성 카테고리',
        isActive: false,
        order: 2,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings/categories')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.isActive).toBe(false);
    });

    it('name이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        description: '설명만 있음',
        isActive: true,
        order: 0,
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/shareholders-meetings/categories')
        .send(createDto)
        .expect(400);
    });
  });

  describe('PATCH /api/admin/shareholders-meetings/categories/:id - 카테고리 수정', () => {
    beforeEach(async () => {
      // 테스트용 카테고리 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings/categories')
        .send({
          name: '테스트 카테고리',
          description: '테스트 설명',
          isActive: true,
          order: 0,
        });
      categoryId = createResponse.body.id;
    });

    it('카테고리를 수정할 수 있어야 한다', async () => {
      // Given
      const updateDto = {
        name: '수정된 카테고리',
        description: '수정된 설명',
        isActive: false,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/categories/${categoryId}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: categoryId,
        name: '수정된 카테고리',
        description: '수정된 설명',
        isActive: false,
      });
    });

    it('일부 필드만 수정할 수 있어야 한다', async () => {
      // Given - name만 수정
      const updateDto = {
        name: '이름만 수정',
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/categories/${categoryId}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.name).toBe('이름만 수정');
      expect(response.body.description).toBe('테스트 설명'); // 기존 값 유지
    });

    it('존재하지 않는 카테고리를 수정하면 404 에러가 발생해야 한다', async () => {
      // Given
      const updateDto = {
        name: '수정 시도',
      };

      // When & Then
      await testSuite
        .request()
        .patch('/api/admin/shareholders-meetings/categories/00000000-0000-0000-0000-000000000001')
        .send(updateDto)
        .expect(404);
    });
  });

  describe('PATCH /api/admin/shareholders-meetings/categories/:id/order - 카테고리 순서 변경', () => {
    beforeEach(async () => {
      // 테스트용 카테고리 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings/categories')
        .send({
          name: '테스트 카테고리',
          isActive: true,
          order: 0,
        });
      categoryId = createResponse.body.id;
    });

    it('카테고리 순서를 변경할 수 있어야 한다', async () => {
      // Given
      const updateDto = {
        order: 10,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/categories/${categoryId}/order`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.order).toBe(10);
    });

    it('order가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/categories/${categoryId}/order`)
        .send({})
        .expect(400);
    });

    it('존재하지 않는 카테고리의 순서를 변경하면 404 에러가 발생해야 한다', async () => {
      // Given
      const updateDto = {
        order: 5,
      };

      // When & Then
      await testSuite
        .request()
        .patch(
          '/api/admin/shareholders-meetings/categories/00000000-0000-0000-0000-000000000001/order',
        )
        .send(updateDto)
        .expect(404);
    });
  });

  describe('DELETE /api/admin/shareholders-meetings/categories/:id - 카테고리 삭제', () => {
    beforeEach(async () => {
      // 테스트용 카테고리 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings/categories')
        .send({
          name: '테스트 카테고리',
          isActive: true,
          order: 0,
        });
      categoryId = createResponse.body.id;
    });

    it('카테고리를 삭제할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .delete(`/api/admin/shareholders-meetings/categories/${categoryId}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
    });

    it('삭제된 카테고리는 목록에 나타나지 않아야 한다', async () => {
      // Given - 카테고리 삭제
      await testSuite
        .request()
        .delete(`/api/admin/shareholders-meetings/categories/${categoryId}`)
        .expect(200);

      // When - 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings/categories')
        .expect(200);

      // Then
      const found = response.body.items.find((c: any) => c.id === categoryId);
      expect(found).toBeUndefined();
    });

    it('존재하지 않는 카테고리를 삭제하면 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .delete('/api/admin/shareholders-meetings/categories/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });

    it('이미 삭제된 카테고리를 다시 삭제하면 404 에러가 발생해야 한다', async () => {
      // Given - 카테고리 삭제
      await testSuite
        .request()
        .delete(`/api/admin/shareholders-meetings/categories/${categoryId}`)
        .expect(200);

      // When & Then - 다시 삭제 시도
      await testSuite
        .request()
        .delete(`/api/admin/shareholders-meetings/categories/${categoryId}`)
        .expect(404);
    });
  });

  describe('카테고리 수정 후 삭제', () => {
    it('수정한 카테고리를 삭제할 수 있어야 한다', async () => {
      // Given - 카테고리 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings/categories')
        .send({
          name: '테스트 카테고리',
          isActive: true,
          order: 0,
        });
      categoryId = createResponse.body.id;

      // Given - 카테고리 수정
      await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/categories/${categoryId}`)
        .send({
          name: '수정된 후 삭제될 카테고리',
        })
        .expect(200);

      // When - 삭제
      const response = await testSuite
        .request()
        .delete(`/api/admin/shareholders-meetings/categories/${categoryId}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
    });
  });

  describe('여러 카테고리 관리', () => {
    it('여러 카테고리를 생성하고 순서대로 조회할 수 있어야 한다', async () => {
      // Given - 여러 카테고리 생성
      const categories = [
        { name: '정기총회', order: 0 },
        { name: '임시총회', order: 1 },
        { name: '특별총회', order: 2 },
      ];

      const createdIds: string[] = [];
      for (const cat of categories) {
        const response = await testSuite
          .request()
          .post('/api/admin/shareholders-meetings/categories')
          .send({
            ...cat,
            isActive: true,
          });
        createdIds.push(response.body.id);
      }

      // When - 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings/categories')
        .expect(200);

      // Then
      const createdCategories = response.body.items.filter((c: any) =>
        createdIds.includes(c.id),
      );
      expect(createdCategories).toHaveLength(3);
    });

    it('활성/비활성 카테고리를 혼합하여 생성할 수 있어야 한다', async () => {
      // Given
      const activeCategory = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings/categories')
        .send({
          name: '활성 카테고리',
          isActive: true,
          order: 0,
        });

      const inactiveCategory = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings/categories')
        .send({
          name: '비활성 카테고리',
          isActive: false,
          order: 1,
        });

      // When - 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings/categories')
        .expect(200);

      // Then
      const active = response.body.items.find(
        (c: any) => c.id === activeCategory.body.id,
      );
      const inactive = response.body.items.find(
        (c: any) => c.id === inactiveCategory.body.id,
      );

      expect(active.isActive).toBe(true);
      expect(inactive.isActive).toBe(false);
    });
  });
});
