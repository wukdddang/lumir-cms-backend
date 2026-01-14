import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/electronic-disclosures (전자공시 조회)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;
  let disclosureIds: string[] = [];

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
    disclosureIds = [];

    // 테스트용 언어 생성
    const langResponse = await testSuite
      .request()
      .post('/api/admin/languages')
      .send({ code: 'ko', name: '한국어', isActive: true });
    languageId = langResponse.body.id;

    // 테스트용 전자공시 3개 생성
    for (let i = 1; i <= 3; i++) {
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify([{
          languageId,
          title: `전자공시 ${i}`,
          description: `설명 ${i}`,
        }]));
      disclosureIds.push(response.body.id);
    }
  });

  describe('전체 목록 조회', () => {
    it('전자공시 전체 목록을 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/all')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        isPublic: true,
      });
    });
  });

  describe('페이징 목록 조회', () => {
    it('기본 페이징으로 전자공시 목록을 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(response.body.items).toHaveLength(3);
    });

    it('페이지 크기를 지정하여 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures?limit=2')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2,
      });
      expect(response.body.items).toHaveLength(2);
    });

    it('두 번째 페이지를 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures?page=2&limit=2')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        page: 2,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
      expect(response.body.items).toHaveLength(1);
    });

    it('번역이 flatten되어 조회되어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures')
        .expect(200);

      // Then
      const firstItem = response.body.items[0];
      expect(firstItem).toHaveProperty('title');
      expect(firstItem).toHaveProperty('description');
      // 한국어 번역이 있으면 한국어 제목, 없으면 첫 번째 번역의 제목
      expect(typeof firstItem.title).toBe('string');
    });
  });

  describe('상세 조회', () => {
    it('전자공시 상세를 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureIds[0]}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: disclosureIds[0],
        isPublic: true,
      });
      // 한국어 + 자동 생성된 언어(들)
      expect(response.body.translations.length).toBeGreaterThanOrEqual(1);
    });

    it('존재하지 않는 전자공시 조회 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });
  });

  describe('공개 여부 필터링', () => {
    beforeEach(async () => {
      // 첫 번째 전자공시를 공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureIds[0]}/public`)
        .send({ isPublic: true });
    });

    it('공개된 전자공시만 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures?isPublic=true')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].isPublic).toBe(true);
    });

    it('비공개 전자공시만 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures?isPublic=false')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].isPublic).toBe(false);
    });
  });
});
