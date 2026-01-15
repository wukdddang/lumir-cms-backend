import { BaseE2ETest } from '../../../base-e2e.spec';

describe('POST /api/admin/brochures (브로슈어 생성)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;

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
  });

  describe('성공 케이스', () => {
    it('유효한 데이터로 브로슈어를 생성해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '회사 소개 브로슈어',
            description: '루미르 테크놀로지 회사 소개서',
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/brochures')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        isPublic: true, // 기본값 확인
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      
      // 자동 번역 동기화로 인해 4개 언어 모두 번역이 생성됨
      expect(response.body.translations).toHaveLength(4);
      
      // 한국어 번역 확인 (isSynced: false, 수동 입력)
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation).toMatchObject({
        languageId,
        title: '회사 소개 브로슈어',
        description: '루미르 테크놀로지 회사 소개서',
        isSynced: false,
      });
      
      // 다른 언어들은 자동 동기화됨 (isSynced: true)
      const syncedTranslations = response.body.translations.filter(
        (t: any) => t.languageId !== languageId,
      );
      expect(syncedTranslations).toHaveLength(3);
      syncedTranslations.forEach((t: any) => {
        expect(t.isSynced).toBe(true);
        expect(t.title).toBe('회사 소개 브로슈어');
      });
    });

    it('여러 언어 번역을 포함한 브로슈어를 생성해야 한다', async () => {
      // Given - 이미 초기화된 영어 언어를 조회
      const languagesResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const englishLanguage = languagesResponse.body.items.find(
        (lang: any) => lang.code === 'en',
      );
      const enLanguageId = englishLanguage.id;

      const createDto = {
        translations: [
          {
            languageId,
            title: '회사 소개 브로슈어',
            description: '루미르 테크놀로지 회사 소개서',
          },
          {
            languageId: enLanguageId,
            title: 'Company Brochure',
            description: 'Lumir Technology Introduction',
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/brochures')
        .send(createDto)
        .expect(201);

      // Then
      // 한국어, 영어는 수동 입력(isSynced: false), 일본어, 중국어는 자동 동기화(isSynced: true)
      expect(response.body.translations).toHaveLength(4);
      
      // 수동 입력된 번역 확인
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation.isSynced).toBe(false);
      
      const enTranslation = response.body.translations.find(
        (t: any) => t.languageId === enLanguageId,
      );
      expect(enTranslation.isSynced).toBe(false);
      expect(enTranslation.title).toBe('Company Brochure');
    });

    it('description 없이 브로슈어를 생성해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '회사 소개 브로슈어',
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/brochures')
        .send(createDto)
        .expect(201);

      // Then
      // 자동 번역 동기화로 4개 언어 생성
      expect(response.body.translations).toHaveLength(4);
      
      // 한국어 번역 확인
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation.title).toBe('회사 소개 브로슈어');
      expect(koTranslation.description).toBeNull();
    });
  });

  describe('실패 케이스 - 필수 필드 누락', () => {
    it('translations가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {};

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/brochures')
        .send(createDto)
        .expect(400);
    });

    it('translation의 title이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given - title 없이 생성 시도
      const createDto = {
        translations: [
          {
            languageId,
            description: '설명만 있음',
            // title 없음
          },
        ],
      };

      // When & Then - DTO validation에서 400 에러 발생
      await testSuite
        .request()
        .post('/api/admin/brochures')
        .send(createDto)
        .expect(400);
    });
  });

  describe('실패 케이스 - 잘못된 데이터', () => {
    it('존재하지 않는 languageId로 생성 시 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId: '00000000-0000-0000-0000-000000000001',
            title: '테스트',
          },
        ],
      };

      // When & Then
      const response = await testSuite
        .request()
        .post('/api/admin/brochures')
        .send(createDto);

      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
