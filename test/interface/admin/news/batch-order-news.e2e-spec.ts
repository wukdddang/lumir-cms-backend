import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PUT /api/admin/news/batch-order (뉴스 순서 일괄 수정)', () => {
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
    it('뉴스 순서를 일괄 수정해야 한다', async () => {
      // Given - 3개의 뉴스 생성
      const newsList: any[] = [];
      for (let i = 1; i <= 3; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', `뉴스${i}`)
          .field('description', `설명${i}`)
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);

        newsList.push(response.body);
      }

      // When - 순서 변경 (역순으로)
      const updateDto = {
        news: [
          { id: newsList[2].id, order: 0 },
          { id: newsList[1].id, order: 1 },
          { id: newsList[0].id, order: 2 },
        ],
      };

      const response = await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        updatedCount: 3,
      });

      // 순서가 변경되었는지 확인
      const news1 = await testSuite
        .request()
        .get(`/api/admin/news/${newsList[0].id}`)
        .expect(200);

      const news2 = await testSuite
        .request()
        .get(`/api/admin/news/${newsList[1].id}`)
        .expect(200);

      const news3 = await testSuite
        .request()
        .get(`/api/admin/news/${newsList[2].id}`)
        .expect(200);

      expect(news1.body.order).toBe(2);
      expect(news2.body.order).toBe(1);
      expect(news3.body.order).toBe(0);
    });

    it('일부 뉴스의 순서만 수정해야 한다', async () => {
      // Given - 5개의 뉴스 생성
      const newsList: any[] = [];
      for (let i = 1; i <= 5; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', `뉴스${i}`)
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);

        newsList.push(response.body);
      }

      const originalOrders = newsList.map((news) => ({
        id: news.id,
        order: news.order,
      }));

      // When - 처음 2개만 순서 변경
      const updateDto = {
        news: [
          { id: newsList[1].id, order: 10 },
          { id: newsList[0].id, order: 20 },
        ],
      };

      const response = await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        updatedCount: 2,
      });

      // 변경된 뉴스 확인
      const news1 = await testSuite
        .request()
        .get(`/api/admin/news/${newsList[0].id}`)
        .expect(200);
      expect(news1.body.order).toBe(20);

      const news2 = await testSuite
        .request()
        .get(`/api/admin/news/${newsList[1].id}`)
        .expect(200);
      expect(news2.body.order).toBe(10);

      // 변경되지 않은 뉴스는 유지 확인
      for (let i = 2; i < 5; i++) {
        const news = await testSuite
          .request()
          .get(`/api/admin/news/${newsList[i].id}`)
          .expect(200);
        expect(news.body.order).toBe(originalOrders[i].order);
      }
    });

    it('단일 뉴스의 순서만 수정해도 동작해야 한다', async () => {
      // Given
      const news1 = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '뉴스1')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '뉴스2')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // When - 하나만 수정
      const updateDto = {
        news: [{ id: news1.body.id, order: 100 }],
      };

      const response = await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        updatedCount: 1,
      });

      const updatedNews = await testSuite
        .request()
        .get(`/api/admin/news/${news1.body.id}`)
        .expect(200);
      expect(updatedNews.body.order).toBe(100);
    });

    it('같은 순서 번호로 여러 뉴스를 설정할 수 있어야 한다', async () => {
      // Given
      const newsList: any[] = [];
      for (let i = 1; i <= 3; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', `뉴스${i}`)
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);
        newsList.push(response.body);
      }

      // When - 모두 같은 순서로 설정
      const updateDto = {
        news: newsList.map((news) => ({ id: news.id, order: 0 })),
      };

      const response = await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        updatedCount: 3,
      });

      // 모두 같은 순서로 설정되었는지 확인
      for (const news of newsList) {
        const getResponse = await testSuite
          .request()
          .get(`/api/admin/news/${news.id}`)
          .expect(200);
        expect(getResponse.body.order).toBe(0);
      }
    });

    it('0 순서도 허용해야 한다', async () => {
      // Given
      const news = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // When
      const updateDto = {
        news: [{ id: news.body.id, order: 0 }],
      };

      const response = await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        updatedCount: 1,
      });

      const updatedNews = await testSuite
        .request()
        .get(`/api/admin/news/${news.body.id}`)
        .expect(200);
      expect(updatedNews.body.order).toBe(0);
    });

    it('큰 순서 번호도 허용해야 한다', async () => {
      // Given
      const news = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // When
      const updateDto = {
        news: [{ id: news.body.id, order: 99999 }],
      };

      const response = await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);

      const updatedNews = await testSuite
        .request()
        .get(`/api/admin/news/${news.body.id}`)
        .expect(200);
      expect(updatedNews.body.order).toBe(99999);
    });
  });

  describe('실패 케이스', () => {
    it('빈 배열로 요청 시 400을 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send({ news: [] })
        .expect(400);
    });

    it('news 필드가 없으면 400을 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send({})
        .expect(400);
    });

    it('잘못된 UUID 형식이 포함되면 400을 반환해야 한다', async () => {
      // Given
      const news = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send({
          news: [
            { id: news.body.id, order: 0 },
            { id: 'non-existent-id', order: 1 },
          ],
        })
        .expect(400);
    });

    it('order 필드가 누락되면 400을 반환해야 한다', async () => {
      // Given
      const news = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send({
          news: [{ id: news.body.id }],
        })
        .expect(400);
    });

    it('id 필드가 누락되면 400을 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send({
          news: [{ order: 0 }],
        })
        .expect(400);
    });

    it('order가 숫자가 아니면 400을 반환해야 한다', async () => {
      // Given
      const news = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send({
          news: [{ id: news.body.id, order: 'invalid' }],
        })
        .expect(400);
    });

    it('order가 음수이면 400을 반환해야 한다', async () => {
      // Given
      const news = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send({
          news: [{ id: news.body.id, order: -1 }],
        })
        .expect(400);
    });
  });

  describe('통합 시나리오', () => {
    it('순서 변경 후 목록 조회 시 순서가 반영되어야 한다', async () => {
      // Given - 5개의 뉴스 생성
      const newsList: any[] = [];
      for (let i = 1; i <= 5; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', `뉴스${i}`)
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);
        newsList.push(response.body);
      }

      // When - 순서 역전
      const reversedOrder = [...newsList]
        .reverse()
        .map((news, index) => ({ id: news.id, order: index }));

      await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send({ news: reversedOrder })
        .expect(200);

      // Then - 목록 조회 시 역순으로 정렬되어 있어야 함
      const listResponse = await testSuite
        .request()
        .get('/api/admin/news?orderBy=order')
        .expect(200);

      expect(listResponse.body.items[0].title).toBe('뉴스5');
      expect(listResponse.body.items[4].title).toBe('뉴스1');
    });

    it('여러 번 순서를 변경해도 정상 동작해야 한다', async () => {
      // Given
      const newsList: any[] = [];
      for (let i = 1; i <= 3; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', `뉴스${i}`)
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);
        newsList.push(response.body);
      }

      // 첫 번째 변경
      await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send({
          news: [
            { id: newsList[0].id, order: 2 },
            { id: newsList[1].id, order: 1 },
            { id: newsList[2].id, order: 0 },
          ],
        })
        .expect(200);

      // 두 번째 변경
      await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send({
          news: [
            { id: newsList[0].id, order: 0 },
            { id: newsList[1].id, order: 1 },
            { id: newsList[2].id, order: 2 },
          ],
        })
        .expect(200);

      // Then - 최종 순서 확인
      const news1 = await testSuite
        .request()
        .get(`/api/admin/news/${newsList[0].id}`)
        .expect(200);
      expect(news1.body.order).toBe(0);

      const news2 = await testSuite
        .request()
        .get(`/api/admin/news/${newsList[1].id}`)
        .expect(200);
      expect(news2.body.order).toBe(1);

      const news3 = await testSuite
        .request()
        .get(`/api/admin/news/${newsList[2].id}`)
        .expect(200);
      expect(news3.body.order).toBe(2);
    });

    it('공개/비공개 상태와 순서가 독립적으로 동작해야 한다', async () => {
      // Given
      const newsList: any[] = [];
      for (let i = 1; i <= 3; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', `뉴스${i}`)
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);
        newsList.push(response.body);
      }

      // 중간 뉴스를 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/news/${newsList[1].id}/public`)
        .send({ isPublic: false })
        .expect(200);

      // When - 순서 변경
      await testSuite
        .request()
        .put('/api/admin/news/batch-order')
        .send({
          news: [
            { id: newsList[2].id, order: 0 },
            { id: newsList[1].id, order: 1 },
            { id: newsList[0].id, order: 2 },
          ],
        })
        .expect(200);

      // Then - 공개 상태는 유지되고 순서만 변경되어야 함
      const news1 = await testSuite
        .request()
        .get(`/api/admin/news/${newsList[1].id}`)
        .expect(200);

      expect(news1.body.isPublic).toBe(false); // 공개 상태 유지
      expect(news1.body.order).toBe(1); // 순서 변경됨
    });
  });
});
