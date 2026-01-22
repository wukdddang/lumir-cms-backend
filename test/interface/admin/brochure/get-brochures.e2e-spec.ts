import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/brochures (브로슈어 목록 조회)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;
  let categoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 이미 초기화된 한국어 언어를 조회
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);

    const koreanLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'ko',
    );

    languageId = koreanLanguage.id;

    // 테스트용 브로슈어 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/brochures/categories')
      .send({
        name: '테스트 카테고리',
        description: 'E2E 테스트용 카테고리',
        order: 0,
      })
      .expect(201);

    categoryId = categoryResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('빈 목록을 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/brochures')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: [],
        total: 0,
      });
    });

    it('등록된 브로슈어 목록을 조회해야 한다', async () => {
      // Given
      const brochures = [
        {
          translations: [
            { languageId, title: '브로슈어 1', description: '설명 1' },
          ],
          categoryId,
        },
        {
          translations: [
            { languageId, title: '브로슈어 2', description: '설명 2' },
          ],
          categoryId,
        },
      ];

      for (const brochure of brochures) {
        await testSuite.request().post('/api/admin/brochures').send(brochure);
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/brochures')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(2);
      // 목록 조회는 translations를 포함하지 않고 title, description을 직접 포함
      expect(response.body.items[0]).toHaveProperty('title');
      expect(response.body.items[0]).toHaveProperty('description');
    });
  });
});

describe('GET /api/admin/brochures/:id (브로슈어 상세 조회)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;
  let categoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 이미 초기화된 한국어 언어를 조회
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);

    const koreanLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'ko',
    );

    languageId = koreanLanguage.id;

    // 테스트용 브로슈어 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/brochures/categories')
      .send({
        name: '테스트 카테고리',
        description: 'E2E 테스트용 카테고리',
        order: 0,
      })
      .expect(201);

    categoryId = categoryResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('ID로 브로슈어를 조회해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/brochures')
        .send({
          translations: [
            {
              languageId,
              title: '회사 소개 브로슈어',
              description: '상세 설명',
            },
          ],
          categoryId,
        });

      const brochureId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/brochures/${brochureId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: brochureId,
        isPublic: true, // 기본값 확인
      });
      // 정책: 입력한 언어(ko) + 자동 생성된 언어들(en, ja, zh) = 총 4개
      expect(response.body.translations).toHaveLength(4);
      
      // 입력한 한국어 번역 확인 (isSynced=false)
      const koTranslation = response.body.translations.find(
        (t: any) => t.language.code === 'ko'
      );
      expect(koTranslation).toMatchObject({
        title: '회사 소개 브로슈어',
        description: '상세 설명',
        isSynced: false, // 수동 입력
      });
      
      // 자동 생성된 번역들 확인 (isSynced=true)
      const autoTranslations = response.body.translations.filter(
        (t: any) => t.language.code !== 'ko'
      );
      expect(autoTranslations).toHaveLength(3); // en, ja, zh
      autoTranslations.forEach((t: any) => {
        expect(t.isSynced).toBe(true); // 자동 동기화
        expect(t.title).toBe('회사 소개 브로슈어'); // 한국어 원본 복사
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
        .get(`/api/admin/brochures/${nonExistentId}`)
        .expect(404);
    });
  });
});
