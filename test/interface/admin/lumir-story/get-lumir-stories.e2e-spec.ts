import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/lumir-stories (루미르스토리 목록 조회)', () => {
  const testSuite = new BaseE2ETest();
  let lumirStoryId: string;
  let categoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 카테고리 먼저 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/lumir-stories/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 카테고리',
      });
    categoryId = categoryResponse.body.id;

    // 테스트용 루미르스토리 생성
    const createResponse = await testSuite
      .request()
      .post('/api/admin/lumir-stories')
      .send({
        title: '테스트 루미르 스토리',
        content: '테스트 내용',
        categoryId,
      });
    lumirStoryId = createResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('빈 목록을 반환해야 한다 (cleanup 후)', async () => {
      // Given - cleanupBeforeTest로 인해 데이터가 없음
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/lumir-stories')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number),
      });
    });

    it('등록된 루미르스토리 목록을 조회해야 한다', async () => {
      // Given - beforeEach에서 생성됨
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/lumir-stories')
        .expect(200);

      // Then
      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      expect(response.body.items[0]).toHaveProperty('id');
      expect(response.body.items[0]).toHaveProperty('title');
      expect(response.body.items[0]).toHaveProperty('content');
    });

    it('공개된 루미르스토리만 조회해야 한다', async () => {
      // Given
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/lumir-stories?isPublic=true')
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
        .get('/api/admin/lumir-stories?page=1&limit=5')
        .expect(200);

      // Then
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.items.length).toBeLessThanOrEqual(5);
    });
  });
});

describe('GET /api/admin/lumir-stories/:id (루미르스토리 상세 조회)', () => {
  const testSuite = new BaseE2ETest();
  let lumirStoryId: string;
  let categoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 카테고리 먼저 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/lumir-stories/categories')
      .send({
        name: '상세 조회 카테고리',
        description: '상세 조회용 카테고리',
      });
    categoryId = categoryResponse.body.id;

    // 테스트용 루미르스토리 생성
    const createResponse = await testSuite
      .request()
      .post('/api/admin/lumir-stories')
      .send({
        title: '상세 조회 테스트',
        content: '상세 조회 내용',
        categoryId,
      });
    lumirStoryId = createResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('ID로 루미르스토리를 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/lumir-stories/${lumirStoryId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: lumirStoryId,
        title: '상세 조회 테스트',
        content: '상세 조회 내용',
        isPublic: true,
        categoryId,
      });
      expect(response.body.categoryName).toBeDefined();
      expect(response.body.categoryName).toBe('상세 조회 카테고리');
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .get(`/api/admin/lumir-stories/${nonExistentId}`)
        .expect(404);
    });
  });
});
