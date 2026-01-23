import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PATCH /api/admin/news/:id/public (뉴스 공개 상태 수정)', () => {
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
    it('뉴스를 공개 상태로 변경해야 한다', async () => {
      // Given - 비공개 뉴스 생성 후 비공개로 변경
      const createResponse = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('description', '테스트 설명')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      const newsId = createResponse.body.id;

      // 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/news/${newsId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // When - 공개로 변경
      const response = await testSuite
        .request()
        .patch(`/api/admin/news/${newsId}/public`)
        .send({ isPublic: true })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: newsId,
        isPublic: true,
      });

      // 조회하여 확인
      const getResponse = await testSuite
        .request()
        .get(`/api/admin/news/${newsId}`)
        .expect(200);

      expect(getResponse.body.isPublic).toBe(true);
    });

    it('뉴스를 비공개 상태로 변경해야 한다', async () => {
      // Given - 공개 뉴스 생성 (기본값이 공개)
      const createResponse = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      const newsId = createResponse.body.id;
      expect(createResponse.body.isPublic).toBe(true);

      // When - 비공개로 변경
      const response = await testSuite
        .request()
        .patch(`/api/admin/news/${newsId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: newsId,
        isPublic: false,
      });

      // 조회하여 확인
      const getResponse = await testSuite
        .request()
        .get(`/api/admin/news/${newsId}`)
        .expect(200);

      expect(getResponse.body.isPublic).toBe(false);
    });

    it('같은 상태로 여러 번 변경해도 동작해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      const newsId = createResponse.body.id;

      // When - 비공개로 여러 번 변경
      await testSuite
        .request()
        .patch(`/api/admin/news/${newsId}/public`)
        .send({ isPublic: false })
        .expect(200);

      const response = await testSuite
        .request()
        .patch(`/api/admin/news/${newsId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(false);
    });

    it('여러 뉴스의 공개 상태를 독립적으로 변경할 수 있어야 한다', async () => {
      // Given - 3개의 뉴스 생성
      const news1 = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '뉴스1')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      const news2 = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '뉴스2')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      const news3 = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '뉴스3')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // When - 각각 다른 상태로 변경
      await testSuite
        .request()
        .patch(`/api/admin/news/${news1.body.id}/public`)
        .send({ isPublic: false })
        .expect(200);

      // news2는 공개 상태 유지

      await testSuite
        .request()
        .patch(`/api/admin/news/${news3.body.id}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then - 각각 확인
      const get1 = await testSuite
        .request()
        .get(`/api/admin/news/${news1.body.id}`)
        .expect(200);
      expect(get1.body.isPublic).toBe(false);

      const get2 = await testSuite
        .request()
        .get(`/api/admin/news/${news2.body.id}`)
        .expect(200);
      expect(get2.body.isPublic).toBe(true);

      const get3 = await testSuite
        .request()
        .get(`/api/admin/news/${news3.body.id}`)
        .expect(200);
      expect(get3.body.isPublic).toBe(false);
    });
  });

  describe('실패 케이스', () => {
    it('잘못된 UUID로 공개 상태 변경 시 400을 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .patch('/api/admin/news/non-existent-id/public')
        .send({ isPublic: true })
        .expect(400);
    });

    it('isPublic 필드가 없으면 400을 반환해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      const newsId = createResponse.body.id;

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/news/${newsId}/public`)
        .send({})
        .expect(400);
    });

    it('isPublic이 boolean이 아니면 400을 반환해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      const newsId = createResponse.body.id;

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/news/${newsId}/public`)
        .send({ isPublic: 'true' })
        .expect(400);
    });
  });

  describe('통합 시나리오', () => {
    it('공개 -> 비공개 -> 공개 순서로 변경이 정상 동작해야 한다', async () => {
      // Given - 뉴스 생성 (기본 공개)
      const createResponse = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '토글 테스트 뉴스')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      const newsId = createResponse.body.id;

      // 1. 초기 상태 확인 (공개)
      let getResponse = await testSuite
        .request()
        .get(`/api/admin/news/${newsId}`)
        .expect(200);
      expect(getResponse.body.isPublic).toBe(true);

      // 2. 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/news/${newsId}/public`)
        .send({ isPublic: false })
        .expect(200);

      getResponse = await testSuite
        .request()
        .get(`/api/admin/news/${newsId}`)
        .expect(200);
      expect(getResponse.body.isPublic).toBe(false);

      // 3. 다시 공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/news/${newsId}/public`)
        .send({ isPublic: true })
        .expect(200);

      getResponse = await testSuite
        .request()
        .get(`/api/admin/news/${newsId}`)
        .expect(200);
      expect(getResponse.body.isPublic).toBe(true);
    });

    it('공개 상태 변경 후 목록 조회 시 필터링이 정상 동작해야 한다', async () => {
      // Given - 3개의 뉴스 생성
      const news1 = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '뉴스1')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      const news2 = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '뉴스2')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '뉴스3')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      // When - 2개를 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/news/${news1.body.id}/public`)
        .send({ isPublic: false })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/news/${news2.body.id}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then - 공개 뉴스 조회
      const publicResponse = await testSuite
        .request()
        .get('/api/admin/news?isPublic=true')
        .expect(200);

      expect(publicResponse.body.total).toBe(1);
      expect(publicResponse.body.items[0].title).toBe('뉴스3');

      // Then - 비공개 뉴스 조회
      const privateResponse = await testSuite
        .request()
        .get('/api/admin/news?isPublic=false')
        .expect(200);

      expect(privateResponse.body.total).toBe(2);
    });
  });
});
