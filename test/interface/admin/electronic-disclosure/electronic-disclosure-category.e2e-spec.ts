import { BaseE2ETest } from '../../../base-e2e.spec';

describe('전자공시 카테고리 E2E 테스트', () => {
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

  describe('POST /api/admin/electronic-disclosures/categories (카테고리 생성)', () => {
    it('새로운 카테고리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '실적 공시',
        description: '실적 관련 전자공시',
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
        name: '실적 공시',
        description: '실적 관련 전자공시',
        isActive: true,
        order: 0,
      });
      categoryId = response.body.id;
    });

    it('description 없이 카테고리를 생성할 수 있어야 한다', async () => {
      // Given
      const createDto = {
        name: '기타 공시',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.name).toBe('기타 공시');
      expect(response.body.description).toBeNull();
    });
  });

  describe('GET /api/admin/electronic-disclosures/categories (카테고리 목록 조회)', () => {
    beforeEach(async () => {
      // 테스트용 카테고리 생성
      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send({ name: '카테고리 1', order: 1 });
      
      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send({ name: '카테고리 2', order: 2 });
    });

    it('카테고리 목록을 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/categories')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: 2,
      });
      expect(response.body.items).toHaveLength(2);
    });
  });

  describe('PATCH /api/admin/electronic-disclosures/categories/:id (카테고리 수정)', () => {
    beforeEach(async () => {
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send({ name: '원본 카테고리', order: 0 });
      categoryId = response.body.id;
    });

    it('카테고리 정보를 수정해야 한다', async () => {
      // Given
      const updateDto = {
        name: '수정된 카테고리',
        description: '수정된 설명',
        isActive: false,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/categories/${categoryId}`)
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

    it('존재하지 않는 카테고리 수정 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .patch('/api/admin/electronic-disclosures/categories/00000000-0000-0000-0000-000000000001')
        .send({ name: '수정' })
        .expect(404);
    });
  });

  describe('PATCH /api/admin/electronic-disclosures/categories/:id/order (카테고리 오더 변경)', () => {
    beforeEach(async () => {
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send({ name: '카테고리', order: 0 });
      categoryId = response.body.id;
    });

    it('카테고리 오더를 변경해야 한다', async () => {
      // Given
      const updateDto = {
        order: 5,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/categories/${categoryId}/order`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.id).toBe(categoryId);
      expect(response.body.order).toBe(5);
    });
  });

  describe('DELETE /api/admin/electronic-disclosures/categories/:id (카테고리 삭제)', () => {
    beforeEach(async () => {
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures/categories')
        .send({ name: '삭제할 카테고리', order: 0 });
      categoryId = response.body.id;
    });

    it('카테고리를 삭제해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/categories/${categoryId}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
    });

    it('삭제된 카테고리는 목록에서 제외되어야 한다', async () => {
      // Given - 카테고리 삭제
      await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/categories/${categoryId}`);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/categories')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(0);
    });

    it('존재하지 않는 카테고리 삭제 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .delete('/api/admin/electronic-disclosures/categories/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });
  });
});
