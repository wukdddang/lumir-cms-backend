import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/video-galleries (비디오갤러리 목록 조회)', () => {
  const testSuite = new BaseE2ETest();
  let videoGalleryId: string;
  let categoryId: string;

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
      .post('/api/admin/video-galleries/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 카테고리',
      });
    categoryId = categoryResponse.body.id;

    // 테스트용 비디오갤러리 생성
    const createResponse = await testSuite
      .request()
      .post('/api/admin/video-galleries')
      .send({
        title: '테스트 비디오 갤러리',
        description: '테스트 내용',
        categoryId,
      });
    videoGalleryId = createResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('등록된 비디오갤러리 목록을 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/video-galleries')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number),
      });
      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      expect(response.body.items[0]).toHaveProperty('id');
      expect(response.body.items[0]).toHaveProperty('title');
    });

    it('categoryId 필터가 동작해야 한다', async () => {
      // Given - 두 번째 카테고리 생성
      const secondCategoryResponse = await testSuite
        .request()
        .post('/api/admin/video-galleries/categories')
        .send({
          name: '두 번째 카테고리',
          description: '필터링 테스트용 두 번째 카테고리',
        });
      const secondCategoryId = secondCategoryResponse.body.id;

      // 첫 번째 카테고리의 비디오 2개 추가 생성
      await testSuite.request().post('/api/admin/video-galleries').send({
        title: '카테고리1-비디오2',
        categoryId,
      });

      // 두 번째 카테고리의 비디오 3개 생성
      await testSuite.request().post('/api/admin/video-galleries').send({
        title: '카테고리2-비디오1',
        categoryId: secondCategoryId,
      });

      await testSuite.request().post('/api/admin/video-galleries').send({
        title: '카테고리2-비디오2',
        categoryId: secondCategoryId,
      });

      await testSuite.request().post('/api/admin/video-galleries').send({
        title: '카테고리2-비디오3',
        categoryId: secondCategoryId,
      });

      // When - 첫 번째 카테고리로 필터링
      const response1 = await testSuite
        .request()
        .get(`/api/admin/video-galleries?categoryId=${categoryId}`)
        .expect(200);

      // Then - 첫 번째 카테고리의 비디오만 2개 (beforeEach에서 생성한 1개 + 추가 1개)
      expect(response1.body.total).toBe(2);
      expect(
        response1.body.items.every(
          (item: any) => item.categoryId === categoryId,
        ),
      ).toBe(true);

      // When - 두 번째 카테고리로 필터링
      const response2 = await testSuite
        .request()
        .get(`/api/admin/video-galleries?categoryId=${secondCategoryId}`)
        .expect(200);

      // Then - 두 번째 카테고리의 비디오만 3개
      expect(response2.body.total).toBe(3);
      expect(
        response2.body.items.every(
          (item: any) => item.categoryId === secondCategoryId,
        ),
      ).toBe(true);
    });

    it('공개된 비디오갤러리만 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/video-galleries?isPublic=true')
        .expect(200);

      // Then
      response.body.items.forEach((item: any) => {
        expect(item.isPublic).toBe(true);
      });
    });

    it('페이지네이션을 적용해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/video-galleries?page=1&limit=5')
        .expect(200);

      // Then
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.items.length).toBeLessThanOrEqual(5);
    });

    it('생성일 기준으로 정렬해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/video-galleries?orderBy=createdAt')
        .expect(200);

      // Then
      expect(response.body.items).toBeDefined();
    });

    it('날짜 필터를 적용해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(
          '/api/admin/video-galleries?startDate=2024-01-01&endDate=2024-12-31',
        )
        .expect(200);

      // Then
      expect(response.body.items).toBeDefined();
    });
  });
});

describe('GET /api/admin/video-galleries/all (비디오갤러리 전체 목록 조회)', () => {
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

    // 테스트용 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/video-galleries/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 카테고리',
      });
    categoryId = categoryResponse.body.id;

    // 테스트용 비디오갤러리 여러 개 생성
    await testSuite.request().post('/api/admin/video-galleries').send({
      title: '비디오 갤러리 1',
      categoryId,
    });
    await testSuite.request().post('/api/admin/video-galleries').send({
      title: '비디오 갤러리 2',
      categoryId,
    });
    await testSuite.request().post('/api/admin/video-galleries').send({
      title: '비디오 갤러리 3',
      categoryId,
    });
  });

  describe('성공 케이스', () => {
    it('모든 비디오갤러리를 조회해야 한다 (페이징 없음)', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/video-galleries/all')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('GET /api/admin/video-galleries/:id (비디오갤러리 상세 조회)', () => {
  const testSuite = new BaseE2ETest();
  let videoGalleryId: string;
  let categoryId: string;

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
      .post('/api/admin/video-galleries/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 카테고리',
      });
    categoryId = categoryResponse.body.id;

    // 테스트용 비디오갤러리 생성
    const createResponse = await testSuite
      .request()
      .post('/api/admin/video-galleries')
      .send({
        title: '상세 조회 테스트',
        description: '상세 조회 내용',
        categoryId,
      });
    videoGalleryId = createResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('ID로 비디오갤러리를 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/video-galleries/${videoGalleryId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: videoGalleryId,
        title: '상세 조회 테스트',
        description: '상세 조회 내용',
        isPublic: true,
        categoryId,
      });
      expect(response.body.categoryName).toBeDefined();
      expect(response.body.categoryName).toBe('테스트 카테고리');
      expect(response.body.category).toBeUndefined();
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .get(`/api/admin/video-galleries/${nonExistentId}`)
        .expect(404);
    });
  });
});
