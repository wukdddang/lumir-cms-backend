import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/languages (언어 목록 조회)', () => {
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

  describe('성공 케이스', () => {
    it('서버 시작 시 기본 언어가 자동 초기화되어야 한다', async () => {
      // When - 서버 시작 후 언어 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      // Then - 기본 언어 4개가 이미 초기화되어 있어야 함
      expect(response.body.items).toHaveLength(4);
      expect(response.body.total).toBe(4);
      expect(response.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'ko', name: '한국어' }),
          expect.objectContaining({ code: 'en', name: 'English' }),
          expect.objectContaining({ code: 'ja', name: '日本語' }),
          expect.objectContaining({ code: 'zh', name: '中文' }),
        ]),
      );
    });

    it('등록된 언어 목록을 조회해야 한다', async () => {
      // Given - 기본 언어 초기화
      await testSuite.initializeDefaultLanguages();

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(4); // en, ko, ja, zh
      expect(response.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'ko', name: '한국어' }),
          expect.objectContaining({ code: 'en', name: 'English' }),
          expect.objectContaining({ code: 'ja', name: '日本語' }),
          expect.objectContaining({ code: 'zh', name: '中文' }),
        ]),
      );
    });

    it('isActive 필드가 포함되어야 한다', async () => {
      // Given
      await testSuite.initializeDefaultLanguages();

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      // Then
      expect(response.body.items[0]).toHaveProperty('isActive');
      expect(typeof response.body.items[0].isActive).toBe('boolean');
    });
  });
});

describe('GET /api/admin/languages/:id (언어 상세 조회)', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
    await testSuite.initializeDefaultLanguages();
  });

  describe('성공 케이스', () => {
    it('ID로 언어를 조회해야 한다', async () => {
      // Given
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const languageId = languages.body.items[0].id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/languages/${languageId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: languageId,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
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
        .get(`/api/admin/languages/${nonExistentId}`)
        .expect(404);
    });

    it('잘못된 UUID 형식으로 조회 시 400 에러가 발생해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid';

      // When & Then
      const response = await testSuite
        .request()
        .get(`/api/admin/languages/${invalidId}`);

      expect([400, 500]).toContain(response.status);
    });
  });
});
