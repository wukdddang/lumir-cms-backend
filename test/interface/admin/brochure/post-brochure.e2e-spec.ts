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

    // 테스트용 언어 생성
    const langResponse = await testSuite
      .request()
      .post('/api/admin/languages')
      .send({ code: 'ko', name: '한국어', isActive: true });
    languageId = langResponse.body.id;
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
      expect(response.body.translations).toHaveLength(1);
      expect(response.body.translations[0]).toMatchObject({
        languageId,
        title: '회사 소개 브로슈어',
        description: '루미르 테크놀로지 회사 소개서',
      });
    });

    it('여러 언어 번역을 포함한 브로슈어를 생성해야 한다', async () => {
      // Given - 영어 언어 추가
      const enLangResponse = await testSuite
        .request()
        .post('/api/admin/languages')
        .send({ code: 'en', name: 'English', isActive: true });
      const enLanguageId = enLangResponse.body.id;

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
      expect(response.body.translations).toHaveLength(2);
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
      expect(response.body.translations[0].description).toBeNull();
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

    it('translation의 title이 누락된 경우 에러가 발생해야 한다', async () => {
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

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/brochures')
        .field('translations', JSON.stringify(createDto.translations));
      
      // Then - title 필드가 없으면 DTO validation 또는 DB에서 에러
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
        .post('/api/admin/brochures')
        .send(createDto);

      expect([400, 404, 500]).toContain(response.status);
    });

  });
});
