import { BaseE2ETest } from '../../../base-e2e.spec';

describe('POST /api/admin/languages (언어 추가)', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    testSuite['skipDefaultLanguageInit'] = true; // 언어 테스트는 기본 언어 초기화 건너뛰기
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  describe('성공 케이스', () => {
    it('유효한 데이터로 언어를 추가해야 한다', async () => {
      // Given
      const createDto = {
        code: 'ko',
        name: '한국어',
        isActive: true,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/languages')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        code: 'ko',
        name: '한국어',
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('여러 언어를 추가해야 한다', async () => {
      // Given
      const languages = [
        { code: 'ko', name: '한국어', isActive: true },
        { code: 'en', name: 'English', isActive: true },
        { code: 'ja', name: '日本語', isActive: true },
        { code: 'zh', name: '中文', isActive: false },
      ];

      // When & Then
      for (const lang of languages) {
        const response = await testSuite
          .request()
          .post('/api/admin/languages')
          .send(lang)
          .expect(201);

        expect(response.body).toMatchObject({
          code: lang.code,
          name: lang.name,
          isActive: lang.isActive,
        });
      }
    });

    it('기본값으로 isActive가 true여야 한다', async () => {
      // Given
      const createDto = {
        code: 'ko',
        name: '한국어',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/languages')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.isActive).toBe(true);
    });
  });

  describe('실패 케이스 - 필수 필드 누락', () => {
    it('code가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        name: '한국어',
        isActive: true,
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/languages')
        .send(createDto)
        .expect(400);
    });

    it('name이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        code: 'ko',
        isActive: true,
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/languages')
        .send(createDto)
        .expect(400);
    });
  });

  describe('실패 케이스 - 잘못된 데이터 타입', () => {
    it('code가 문자열이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        code: 123,
        name: '한국어',
        isActive: true,
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/languages')
        .send(createDto)
        .expect(400);
    });

    it('isActive가 boolean이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        code: 'ko',
        name: '한국어',
        isActive: 'true',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/languages')
        .send(createDto)
        .expect(400);
    });
  });

  describe('실패 케이스 - 중복 데이터', () => {
    it('이미 존재하는 code로 추가 시 409 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        code: 'ko',
        name: '한국어',
        isActive: true,
      };

      await testSuite.request().post('/api/admin/languages').send(createDto);

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/languages')
        .send(createDto)
        .expect(409);
    });
  });
});
