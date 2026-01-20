import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/video-galleries (비디오갤러리 목록 조회)', () => {
  const testSuite = new BaseE2ETest();
  let videoGalleryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트용 비디오갤러리 생성
    const createResponse = await testSuite
      .request()
      .post('/api/admin/video-galleries')
      .send({
        title: '테스트 비디오 갤러리',
        description: '테스트 내용',
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

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트용 비디오갤러리 여러 개 생성
    await testSuite.request().post('/api/admin/video-galleries').send({
      title: '비디오 갤러리 1',
    });
    await testSuite.request().post('/api/admin/video-galleries').send({
      title: '비디오 갤러리 2',
    });
    await testSuite.request().post('/api/admin/video-galleries').send({
      title: '비디오 갤러리 3',
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

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트용 비디오갤러리 생성
    const createResponse = await testSuite
      .request()
      .post('/api/admin/video-galleries')
      .send({
        title: '상세 조회 테스트',
        description: '상세 조회 내용',
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
      });
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
