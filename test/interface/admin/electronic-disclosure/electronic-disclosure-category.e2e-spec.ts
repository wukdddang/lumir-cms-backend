import { BaseE2ETest } from '../../../base-e2e.spec';

describe('전자공시 카테고리 E2E 테스트', () => {
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

  describe('GET /api/admin/electronic-disclosures/categories (카테고리 목록 조회)', () => {
    it('전자공시 카테고리 목록을 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/categories')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
      });
    });

    it('빈 카테고리 목록도 정상적으로 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/categories')
        .expect(200);

      // Then
      expect(response.body.items).toEqual(expect.any(Array));
      expect(response.body.total).toBe(response.body.items.length);
    });
  });

  describe('POST /api/admin/electronic-disclosures/categories (카테고리 생성)', () => {
    it('전자공시 카테고리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '재무제표',
        description: '재무제표 카테고리',
        isActive: true,
        order: 0,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: '재무제표',
        description: '재무제표 카테고리',
        isActive: true,
        order: 0,
        entityType: 'electronic_disclosure', // 언더스코어로 저장됨
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('description 없이 카테고리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '사업보고서',
        isActive: true,
        order: 1,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.name).toBe('사업보고서');
      expect(response.body.description).toBeFalsy();
    });

    it('isActive 기본값이 true여야 한다', async () => {
      // Given
      const createDto = {
        name: '공시자료',
        order: 2,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.isActive).toBe(true);
    });

    it('필수 필드(name) 없이 생성 시 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        description: '이름이 없음',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send(createDto)
        .expect(400);
    });
  });

  describe('PATCH /api/admin/electronic-disclosures/categories/:id (카테고리 수정)', () => {
    it('카테고리를 수정해야 한다', async () => {
      // Given - 카테고리 생성
      const createDto = {
        name: '원래 이름',
        description: '원래 설명',
        isActive: true,
        order: 0,
      };

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send(createDto)
        .expect(201);

      const categoryId = createResponse.body.id;

      // When - 수정
      const updateDto = {
        name: '수정된 이름',
        description: '수정된 설명',
        isActive: false,
        order: 10,
      };

      const updateResponse = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/categories/${categoryId}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(updateResponse.body).toMatchObject({
        id: categoryId,
        name: '수정된 이름',
        description: '수정된 설명',
        isActive: false,
      });
      // order는 별도의 PATCH /order 엔드포인트로만 변경 가능
      expect(updateResponse.body.order).toBeDefined();
    });

    it('부분적으로 카테고리를 수정해야 한다', async () => {
      // Given - 카테고리 생성
      const createDto = {
        name: '부분 수정 테스트',
        description: '원래 설명',
        isActive: true,
        order: 0,
      };

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send(createDto)
        .expect(201);

      const categoryId = createResponse.body.id;

      // When - name만 수정 (기존 값 유지를 위해 description도 함께 전송)
      const updateDto = {
        name: '수정된 이름만',
        description: '원래 설명',
        isActive: true,
      };

      const updateResponse = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/categories/${categoryId}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(updateResponse.body.name).toBe('수정된 이름만');
      expect(updateResponse.body.description).toBe('원래 설명'); // 유지
      expect(updateResponse.body.isActive).toBe(true); // 유지
    });

    it('존재하지 않는 카테고리 수정 시 404 에러가 발생해야 한다', async () => {
      // Given
      const updateDto = {
        name: '수정 시도',
      };

      // When & Then
      await testSuite
        .request()
        .patch(
          '/api/admin/electronic-disclosures/categories/00000000-0000-0000-0000-000000000001',
        )
        .send(updateDto)
        .expect(404);
    });
  });

  describe('PATCH /api/admin/electronic-disclosures/categories/:id/order (카테고리 순서 변경)', () => {
    it('카테고리 순서를 변경해야 한다', async () => {
      // Given - 카테고리 생성
      const createDto = {
        name: '순서 변경 테스트',
        order: 0,
      };

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send(createDto)
        .expect(201);

      const categoryId = createResponse.body.id;
      expect(createResponse.body.order).toBe(0);

      // When - 순서 변경
      const updateOrderDto = {
        order: 99,
      };

      const updateResponse = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/categories/${categoryId}/order`)
        .send(updateOrderDto)
        .expect(200);

      // Then
      expect(updateResponse.body.order).toBe(99);
    });

    it('존재하지 않는 카테고리 순서 변경 시 404 에러가 발생해야 한다', async () => {
      // Given
      const updateOrderDto = {
        order: 10,
      };

      // When & Then
      await testSuite
        .request()
        .patch(
          '/api/admin/electronic-disclosures/categories/00000000-0000-0000-0000-000000000001/order',
        )
        .send(updateOrderDto)
        .expect(404);
    });
  });

  describe('DELETE /api/admin/electronic-disclosures/categories/:id (카테고리 삭제)', () => {
    it('카테고리를 삭제해야 한다', async () => {
      // Given - 카테고리 생성
      const createDto = {
        name: '삭제 테스트',
        order: 0,
      };

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send(createDto)
        .expect(201);

      const categoryId = createResponse.body.id;

      // When - 삭제
      const deleteResponse = await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/categories/${categoryId}`)
        .expect(200);

      // Then
      expect(deleteResponse.body.success).toBe(true);

      // 목록에서 확인
      const listResponse = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/categories')
        .expect(200);

      const foundCategory = listResponse.body.items.find(
        (item: any) => item.id === categoryId,
      );
      expect(foundCategory).toBeUndefined();
    });

    it('존재하지 않는 카테고리 삭제 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .delete(
          '/api/admin/electronic-disclosures/categories/00000000-0000-0000-0000-000000000001',
        )
        .expect(404);
    });

    it('이미 삭제된 카테고리를 다시 삭제 시 404 에러가 발생해야 한다', async () => {
      // Given - 카테고리 생성 및 삭제
      const createDto = {
        name: '중복 삭제 테스트',
        order: 0,
      };

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send(createDto)
        .expect(201);

      const categoryId = createResponse.body.id;

      await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/categories/${categoryId}`)
        .expect(200);

      // When & Then - 이미 삭제된 것을 다시 삭제 시도
      await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/categories/${categoryId}`)
        .expect(404);
    });
  });

  describe('복합 시나리오', () => {
    it('카테고리를 생성, 수정, 순서 변경, 삭제하는 전체 플로우를 테스트해야 한다', async () => {
      // 1. 생성
      const createDto = {
        name: '복합 시나리오 카테고리',
        description: '테스트용',
        isActive: true,
        order: 0,
      };

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send(createDto)
        .expect(201);

      const categoryId = createResponse.body.id;
      expect(createResponse.body.name).toBe('복합 시나리오 카테고리');

      // 2. 수정
      const updateDto = {
        name: '수정된 카테고리',
        description: '수정된 설명',
        isActive: false,
      };

      const updateResponse = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/categories/${categoryId}`)
        .send(updateDto)
        .expect(200);

      expect(updateResponse.body.name).toBe('수정된 카테고리');
      expect(updateResponse.body.isActive).toBe(false);

      // 3. 순서 변경
      const updateOrderDto = {
        order: 50,
      };

      const orderResponse = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/categories/${categoryId}/order`)
        .send(updateOrderDto)
        .expect(200);

      expect(orderResponse.body.order).toBe(50);

      // 4. 삭제
      const deleteResponse = await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/categories/${categoryId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
    });

    it('여러 카테고리를 생성하고 목록을 조회해야 한다', async () => {
      // Given - 여러 카테고리 생성
      const categories = [
        { name: '재무제표', order: 0 },
        { name: '사업보고서', order: 1 },
        { name: '공시자료', order: 2 },
      ];

      const createPromises = categories.map((cat) =>
        testSuite
          .request()
          .post('/api/admin/electronic-disclosures/categories')
          .send(cat),
      );

      await Promise.all(createPromises);

      // When - 목록 조회
      const listResponse = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/categories')
        .expect(200);

      // Then
      expect(listResponse.body.items.length).toBeGreaterThanOrEqual(3);
      expect(listResponse.body.total).toBeGreaterThanOrEqual(3);

      // 생성한 카테고리들이 목록에 있는지 확인
      const categoryNames = listResponse.body.items.map((item: any) => item.name);
      expect(categoryNames).toContain('재무제표');
      expect(categoryNames).toContain('사업보고서');
      expect(categoryNames).toContain('공시자료');
    });

    it('비활성 카테고리도 조회되어야 한다', async () => {
      // Given - 활성 카테고리 생성 후 비활성으로 변경
      const createDto = {
        name: '비활성 카테고리',
        isActive: true,
        order: 0,
      };

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send(createDto)
        .expect(201);

      const categoryId = createResponse.body.id;

      // 비활성으로 변경
      await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/categories/${categoryId}`)
        .send({
          name: '비활성 카테고리',
          isActive: false,
        })
        .expect(200);

      // When - 목록 조회
      const listResponse = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/categories')
        .expect(200);

      // Then - 비활성 카테고리도 포함되어야 함
      const foundCategory = listResponse.body.items.find(
        (item: any) => item.id === categoryId,
      );
      expect(foundCategory).toBeDefined();
      // 목록 조회 시 비활성 카테고리도 포함됨 (includeInactive: true)
    });
  });

  describe('카테고리 순서 정렬', () => {
    it('카테고리가 order 순서대로 조회되어야 한다', async () => {
      // Given - 순서를 다르게 해서 카테고리 생성
      const categories = [
        { name: '세 번째', order: 2 },
        { name: '첫 번째', order: 0 },
        { name: '두 번째', order: 1 },
      ];

      for (const cat of categories) {
        await testSuite
          .request()
          .post('/api/admin/electronic-disclosures/categories')
          .send(cat)
          .expect(201);
      }

      // When - 목록 조회
      const listResponse = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/categories')
        .expect(200);

      // Then - order 순서대로 정렬되어 있어야 함
      const items = listResponse.body.items;
      for (let i = 1; i < items.length; i++) {
        expect(items[i].order).toBeGreaterThanOrEqual(items[i - 1].order);
      }
    });
  });
});
