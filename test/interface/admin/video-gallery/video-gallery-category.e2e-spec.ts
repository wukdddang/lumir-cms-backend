import { BaseE2ETest } from '../../../base-e2e.spec';

describe('비디오갤러리 카테고리 관리 (E2E)', () => {
  const testSuite = new BaseE2ETest();
  let createdCategoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  describe('POST /api/admin/video-galleries/categories - 비디오갤러리 카테고리 생성', () => {
    it('카테고리를 생성할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .post('/api/admin/video-galleries/categories')
        .send({
          name: '회사 소개',
          description: '회사 관련 비디오 갤러리',
          order: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('회사 소개');
      expect(response.body.order).toBe(1);
      expect(response.body.isActive).toBe(true);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      createdCategoryId = response.body.id;
    });

    it('이름만으로 카테고리를 생성할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .post('/api/admin/video-galleries/categories')
        .send({
          name: '제품 소개',
        })
        .expect(201);

      expect(response.body.name).toBe('제품 소개');
      expect(response.body.isActive).toBe(true);
    });

    it('이름 없이 카테고리를 생성하면 실패해야 한다', async () => {
      await testSuite
        .request()
        .post('/api/admin/video-galleries/categories')
        .send({
          description: '설명만 있음',
        })
        .expect(400);
    });
  });

  describe('GET /api/admin/video-galleries/categories - 비디오갤러리 카테고리 목록 조회', () => {
    it('카테고리 목록을 조회할 수 있어야 한다', async () => {
      // Given: 카테고리 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/video-galleries/categories')
        .send({
          name: '테스트 카테고리',
          description: '테스트용',
          order: 1,
        });

      const categoryId = createResponse.body.id;

      // When: 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/video-galleries/categories')
        .expect(200);

      // Then
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(1);

      const foundCategory = response.body.items.find(
        (cat: any) => cat.id === categoryId,
      );
      expect(foundCategory).toBeDefined();
      expect(foundCategory.name).toBe('테스트 카테고리');
    });

    it('활성화된 카테고리만 조회해야 한다', async () => {
      // Given: 카테고리 생성
      await testSuite
        .request()
        .post('/api/admin/video-galleries/categories')
        .send({
          name: '활성 카테고리',
          isActive: true,
        });

      // When: 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/video-galleries/categories')
        .expect(200);

      // Then
      response.body.items.forEach((cat: any) => {
        expect(cat.isActive).toBe(true);
      });
    });
  });

  describe('PATCH /api/admin/video-galleries/categories/:id - 비디오갤러리 카테고리 수정', () => {
    it('카테고리 정보를 수정할 수 있어야 한다', async () => {
      // Given: 카테고리 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/video-galleries/categories')
        .send({
          name: '원본 카테고리',
          description: '원본 설명',
        });

      const categoryId = createResponse.body.id;

      // When: 카테고리 수정
      const response = await testSuite
        .request()
        .patch(`/api/admin/video-galleries/categories/${categoryId}`)
        .send({
          name: '수정된 카테고리',
          description: '수정된 설명',
        })
        .expect(200);

      // Then
      expect(response.body.id).toBe(categoryId);
      expect(response.body.name).toBe('수정된 카테고리');
      expect(response.body.description).toBe('수정된 설명');
    });

    it('카테고리를 비활성화할 수 있어야 한다', async () => {
      // Given: 카테고리 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/video-galleries/categories')
        .send({
          name: '비활성화 테스트',
        });

      const categoryId = createResponse.body.id;

      // When: 비활성화
      const response = await testSuite
        .request()
        .patch(`/api/admin/video-galleries/categories/${categoryId}`)
        .send({
          isActive: false,
        })
        .expect(200);

      // Then
      expect(response.body.isActive).toBe(false);
    });

    it('존재하지 않는 카테고리 수정 시 404 에러가 발생해야 한다', async () => {
      await testSuite
        .request()
        .patch(
          '/api/admin/video-galleries/categories/00000000-0000-0000-0000-000000000001',
        )
        .send({
          name: '수정된 이름',
        })
        .expect(404);
    });
  });

  describe('PATCH /api/admin/video-galleries/categories/:id/order - 비디오갤러리 카테고리 오더 변경', () => {
    it('카테고리 오더를 변경할 수 있어야 한다', async () => {
      // Given: 카테고리 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/video-galleries/categories')
        .send({
          name: '오더 테스트',
          order: 1,
        });

      const categoryId = createResponse.body.id;

      // When: 오더 변경
      const response = await testSuite
        .request()
        .patch(`/api/admin/video-galleries/categories/${categoryId}/order`)
        .send({
          order: 10,
        })
        .expect(200);

      // Then
      expect(response.body.id).toBe(categoryId);
      expect(response.body.order).toBe(10);
    });

    it('존재하지 않는 카테고리의 오더를 변경하면 실패해야 한다', async () => {
      await testSuite
        .request()
        .patch(
          '/api/admin/video-galleries/categories/00000000-0000-0000-0000-000000000001/order',
        )
        .send({
          order: 5,
        })
        .expect(404);
    });
  });

  describe('DELETE /api/admin/video-galleries/categories/:id - 비디오갤러리 카테고리 삭제', () => {
    it('카테고리를 삭제할 수 있어야 한다', async () => {
      // Given: 카테고리 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/video-galleries/categories')
        .send({
          name: '삭제 테스트',
        });

      const categoryId = createResponse.body.id;

      // When: 삭제
      const response = await testSuite
        .request()
        .delete(`/api/admin/video-galleries/categories/${categoryId}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
    });

    it('삭제된 카테고리는 목록에 나타나지 않아야 한다', async () => {
      // Given: 카테고리 생성 후 삭제
      const createResponse = await testSuite
        .request()
        .post('/api/admin/video-galleries/categories')
        .send({
          name: '삭제 테스트 2',
        });

      const categoryId = createResponse.body.id;

      await testSuite
        .request()
        .delete(`/api/admin/video-galleries/categories/${categoryId}`)
        .expect(200);

      // When: 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/video-galleries/categories')
        .expect(200);

      // Then
      const found = response.body.items.find(
        (cat: any) => cat.id === categoryId,
      );
      expect(found).toBeUndefined();
    });

    it('존재하지 않는 카테고리를 삭제하면 404 에러가 발생해야 한다', async () => {
      await testSuite
        .request()
        .delete(
          '/api/admin/video-galleries/categories/00000000-0000-0000-0000-000000000001',
        )
        .expect(404);
    });
  });
});
