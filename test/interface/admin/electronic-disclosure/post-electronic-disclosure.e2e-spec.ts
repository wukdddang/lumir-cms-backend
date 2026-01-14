import { BaseE2ETest } from '../../../base-e2e.spec';

describe('POST /api/admin/electronic-disclosures (전자공시 생성)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;
  let enLanguageId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트용 언어 생성
    const langResponse = await testSuite
      .request()
      .post('/api/admin/languages')
      .send({ code: 'ko', name: '한국어', isActive: true });
    languageId = langResponse.body.id;

    const enLangResponse = await testSuite
      .request()
      .post('/api/admin/languages')
      .send({ code: 'en', name: 'English', isActive: true });
    enLanguageId = enLangResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('유효한 데이터로 전자공시를 생성해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '2024년 1분기 실적 공시',
            description: '2024년 1분기 실적 공시 자료입니다.',
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(createDto.translations))
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        isPublic: true, // 기본값
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(response.body.translations).toHaveLength(2); // 한국어 + 영어 자동 생성
      
      // 한국어 번역 확인 (isSynced: false)
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId
      );
      expect(koTranslation).toMatchObject({
        title: '2024년 1분기 실적 공시',
        description: '2024년 1분기 실적 공시 자료입니다.',
      });
    });

    it('여러 언어 번역을 포함한 전자공시를 생성해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '2024년 1분기 실적 공시',
            description: '2024년 1분기 실적 공시 자료입니다.',
          },
          {
            languageId: enLanguageId,
            title: 'Q1 2024 Earnings Disclosure',
            description: 'Q1 2024 earnings disclosure material.',
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(createDto.translations))
        .expect(201);

      // Then
      expect(response.body.translations).toHaveLength(2);
      
      // 각 언어 번역 확인
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId
      );
      expect(koTranslation.title).toBe('2024년 1분기 실적 공시');
      
      const enTranslation = response.body.translations.find(
        (t: any) => t.languageId === enLanguageId
      );
      expect(enTranslation.title).toBe('Q1 2024 Earnings Disclosure');
    });

    it('description 없이 전자공시를 생성해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '2024년 2분기 실적 공시',
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(createDto.translations))
        .expect(201);

      // Then
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId
      );
      expect(koTranslation.description).toBeNull();
    });
  });

  describe('실패 케이스 - 필수 필드 누락', () => {
    it('translations가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .send({})
        .expect(400);
    });

    it('translation의 title이 누락된 경우 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            description: '설명만 있음',
          },
        ],
      };

      // When & Then
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(createDto.translations));
      
      expect([400, 500]).toContain(response.status);
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
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(createDto.translations));

      expect([400, 404, 500]).toContain(response.status);
    });

    it('중복된 언어 ID로 생성 시 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '첫 번째',
          },
          {
            languageId, // 중복
            title: '두 번째',
          },
        ],
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(createDto.translations))
        .expect(400);
    });
  });
});
