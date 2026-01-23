import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/news (뉴스 목록 조회)', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupSpecificTables(['news']);
  });

  describe('성공 케이스', () => {
    it('모든 뉴스를 조회해야 한다', async () => {
      // Given - 3개의 뉴스 생성
      const newsList = [];
      for (let i = 1; i <= 3; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', `뉴스${i}`)
          .field('description', `설명${i}`)
          .field('url', `https://news.example.com/${i}`)
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);

        newsList.push(response.body);
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/news')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({ title: '뉴스1' }),
          expect.objectContaining({ title: '뉴스2' }),
          expect.objectContaining({ title: '뉴스3' }),
        ]),
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('공개 여부로 필터링하여 조회해야 한다', async () => {
      // Given - 공개/비공개 뉴스 생성
      await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '공개 뉴스')
        .field('description', '공개된 뉴스입니다')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      const privateNews = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '비공개 뉴스')
        .field('description', '비공개된 뉴스입니다')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/news/${privateNews.body.id}/public`)
        .send({ isPublic: false })
        .expect(200);

      // When - 공개 뉴스만 조회
      const publicResponse = await testSuite
        .request()
        .get('/api/admin/news?isPublic=true')
        .expect(200);

      // Then
      expect(publicResponse.body.total).toBe(1);
      expect(publicResponse.body.items[0].title).toBe('공개 뉴스');

      // When - 비공개 뉴스만 조회
      const privateResponse = await testSuite
        .request()
        .get('/api/admin/news?isPublic=false')
        .expect(200);

      // Then
      expect(privateResponse.body.total).toBe(1);
      expect(privateResponse.body.items[0].title).toBe('비공개 뉴스');
    });

    it('페이징이 적용되어야 한다', async () => {
      // Given - 15개의 뉴스 생성
      for (let i = 1; i <= 15; i++) {
        await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', `뉴스${i}`)
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);
      }

      // When - 1페이지 조회 (limit: 10)
      const page1 = await testSuite
        .request()
        .get('/api/admin/news?page=1&limit=10')
        .expect(200);

      // Then
      expect(page1.body).toMatchObject({
        total: 15,
        page: 1,
        limit: 10,
        totalPages: 2,
      });
      expect(page1.body.items.length).toBe(10);

      // When - 2페이지 조회
      const page2 = await testSuite
        .request()
        .get('/api/admin/news?page=2&limit=10')
        .expect(200);

      // Then
      expect(page2.body).toMatchObject({
        total: 15,
        page: 2,
        limit: 10,
        totalPages: 2,
      });
      expect(page2.body.items.length).toBe(5);
    });

    it('정렬 기준이 적용되어야 한다', async () => {
      // Given - 시간차를 두고 뉴스 생성
      const news1 = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '첫 번째 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const news2 = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '두 번째 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // When - order로 정렬 (오름차순)
      const orderResponse = await testSuite
        .request()
        .get('/api/admin/news?orderBy=order')
        .expect(200);

      // Then - order 값 확인 (ASC 정렬이므로 작은 값이 먼저)
      expect(orderResponse.body.items.length).toBe(2);
      const orders = orderResponse.body.items.map((item: any) => item.order);
      
      // 두 뉴스가 서로 다른 order를 가져야 함
      expect(news1.body.order).not.toBe(news2.body.order);
      // ASC 정렬이므로 첫 번째 항목의 order가 더 작거나 같아야 함
      expect(orders[0]).toBeLessThanOrEqual(orders[1]);

      // When - createdAt으로 정렬
      const createdAtResponse = await testSuite
        .request()
        .get('/api/admin/news?orderBy=createdAt')
        .expect(200);

      // Then - 최근 생성된 항목이 먼저 나와야 함
      expect(createdAtResponse.body.items.length).toBe(2);
      const dates = createdAtResponse.body.items.map(
        (item: any) => new Date(item.createdAt).getTime(),
      );
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });

    it('날짜 범위로 필터링하여 조회해야 한다', async () => {
      // Given - 뉴스 생성
      const news1 = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '첫 번째 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const news2 = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '두 번째 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // When - 오늘 날짜로 필터링
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000)
        .toISOString()
        .split('T')[0];
      const response = await testSuite
        .request()
        .get(`/api/admin/news?startDate=${today}&endDate=${tomorrow}`)
        .expect(200);

      // Then - 오늘 생성된 뉴스가 조회되어야 함
      expect(response.body.total).toBeGreaterThanOrEqual(2);
      expect(response.body.items.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/admin/news/all (전체 목록 조회)', () => {
    it('페이징 없이 전체 뉴스를 조회해야 한다', async () => {
      // Given - 5개의 뉴스 생성
      for (let i = 1; i <= 5; i++) {
        await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', `뉴스${i}`)
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/news/all')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(5);
    });
  });

  describe('GET /api/admin/news/:id (뉴스 상세 조회)', () => {
    it('뉴스 상세를 조회해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '뉴스 제목')
        .field('description', '뉴스 설명')
        .field('url', 'https://news.example.com/article')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      const newsId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/news/${newsId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: newsId,
        title: '뉴스 제목',
        description: '뉴스 설명',
        url: 'https://news.example.com/article',
        isPublic: true,
      });
    });

    it('잘못된 UUID 형식으로 조회 시 400을 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/api/admin/news/non-existent-id')
        .expect(400);
    });

    it('존재하지 않는 UUID로 조회 시 404를 반환해야 한다', async () => {
      // Given - 유효한 UUID 형식이지만 존재하지 않는 ID
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await testSuite
        .request()
        .get(`/api/admin/news/${nonExistentUuid}`)
        .expect(404);
    });
  });

  describe('엣지 케이스', () => {
    it('빈 목록을 조회할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/news')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('잘못된 페이지 번호로 조회해도 응답해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/news?page=999&limit=10')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: [],
        total: 0,
        page: 999,
        limit: 10,
      });
    });

    it('잘못된 orderBy 값은 기본값(order)으로 처리되어야 한다', async () => {
      // Given
      await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // When - 잘못된 orderBy 값
      const response = await testSuite
        .request()
        .get('/api/admin/news?orderBy=invalid')
        .expect(200);

      // Then
      expect(response.body.items.length).toBeGreaterThan(0);
    });
  });
});
