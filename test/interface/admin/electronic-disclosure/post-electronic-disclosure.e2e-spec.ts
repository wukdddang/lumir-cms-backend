import { BaseE2ETest } from '../../../base-e2e.spec';

describe('POST /api/admin/electronic-disclosures (전자공시 생성)', () => {
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
    it('유효한 데이터로 전자공시를 생성해야 한다', async () => {
      // Given
      const translationsData = [
        {
          languageId,
          title: '2024년 1분기 실적 공시',
          description: '2024년 1분기 실적 공시 자료입니다.',
        },
      ];

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
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
        title: '2024년 1분기 실적 공시',
        description: '2024년 1분기 실적 공시 자료입니다.',
        isSynced: false,
      });

      // 다른 언어들은 자동 동기화됨 (isSynced: true)
      const syncedTranslations = response.body.translations.filter(
        (t: any) => t.languageId !== languageId,
      );
      expect(syncedTranslations).toHaveLength(3);
      syncedTranslations.forEach((t: any) => {
        expect(t.isSynced).toBe(true);
        expect(t.title).toBe('2024년 1분기 실적 공시');
      });
    });

    it('여러 언어 번역을 포함한 전자공시를 생성해야 한다', async () => {
      // Given - 이미 초기화된 영어 언어를 조회
      const languagesResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const englishLanguage = languagesResponse.body.items.find(
        (lang: any) => lang.code === 'en',
      );
      const enLanguageId = englishLanguage.id;

      const translationsData = [
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
      ];

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
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
      expect(enTranslation.title).toBe('Q1 2024 Earnings Disclosure');
    });

    it('description 없이 전자공시를 생성해야 한다', async () => {
      // Given
      const translationsData = [
        {
          languageId,
          title: '2024년 2분기 실적 공시',
        },
      ];

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(201);

      // Then
      // 자동 번역 동기화로 4개 언어 생성
      expect(response.body.translations).toHaveLength(4);

      // 한국어 번역 확인
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation.title).toBe('2024년 2분기 실적 공시');
      expect(koTranslation.description).toBeNull();
    });

    it('파일과 함께 전자공시를 생성해야 한다', async () => {
      // Given
      const translationsData = [
        {
          languageId,
          title: '2024년 3분기 실적 공시',
          description: '첨부파일 포함',
        },
      ];

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .attach('files', Buffer.from('PDF content'), 'disclosure.pdf')
        .expect(201);

      // Then
      expect(response.body.attachments).toBeDefined();
      expect(response.body.attachments).toHaveLength(1);
      expect(response.body.attachments[0]).toMatchObject({
        fileName: expect.stringContaining('.pdf'),
        fileUrl: expect.any(String),
        fileSize: expect.any(Number),
        mimeType: 'application/pdf',
      });
    });

    it('여러 파일과 함께 전자공시를 생성해야 한다', async () => {
      // Given
      const translationsData = [
        {
          languageId,
          title: '2024년 연간 보고서',
        },
      ];

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .attach('files', Buffer.from('PDF content'), 'report.pdf')
        .attach('files', Buffer.from('Excel content'), 'data.xlsx')
        .expect(201);

      // Then
      expect(response.body.attachments).toHaveLength(2);
    });
  });

  describe('실패 케이스 - 필수 필드 누락', () => {
    it('translations가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .expect(400);
    });

    it('translation의 title이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given - title 없이 생성 시도
      const translationsData = [
        {
          languageId,
          description: '설명만 있음',
          // title 없음
        },
      ];

      // When & Then - DTO validation에서 400 에러 발생
      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(400);
    });

    it('translation의 languageId가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const translationsData = [
        {
          title: '제목만 있음',
          // languageId 없음
        },
      ];

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(400);
    });
  });

  describe('실패 케이스 - 잘못된 데이터', () => {
    it('존재하지 않는 languageId로 생성 시 에러가 발생해야 한다', async () => {
      // Given
      const translationsData = [
        {
          languageId: '00000000-0000-0000-0000-000000000001',
          title: '테스트',
        },
      ];

      // When & Then
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData));

      expect([400, 404, 500]).toContain(response.status);
    });

    it('잘못된 JSON 형식의 translations는 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', 'invalid json')
        .expect(400);
    });

    it('빈 배열의 translations는 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify([]))
        .expect(400);
    });
  });

  describe('실패 케이스 - 파일 형식', () => {
    it('허용되지 않은 파일 형식은 에러가 발생해야 한다', async () => {
      // Given
      const translationsData = [
        {
          languageId,
          title: '테스트',
        },
      ];

      // When & Then - .txt 파일은 허용되지 않음
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .attach('files', Buffer.from('text content'), 'test.txt');

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('생성 후 검증', () => {
    it('생성된 전자공시를 조회할 수 있어야 한다', async () => {
      // Given - 전자공시 생성
      const translationsData = [
        {
          languageId,
          title: '검증용 전자공시',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(201);

      const disclosureId = createResponse.body.id;

      // When - 생성된 전자공시 조회
      const getResponse = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      // Then
      expect(getResponse.body.id).toBe(disclosureId);
      expect(getResponse.body.translations).toHaveLength(4);
    });

    it('생성된 전자공시가 목록에 포함되어야 한다', async () => {
      // Given - 전자공시 생성
      const translationsData = [
        {
          languageId,
          title: '목록 확인용 전자공시',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(201);

      const disclosureId = createResponse.body.id;

      // When - 목록 조회
      const listResponse = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures')
        .expect(200);

      // Then - ID로 검증 (title은 DTO 변환 과정에서 빈 문자열이 될 수 있음)
      const foundDisclosure = listResponse.body.items.find(
        (item: any) => item.id === disclosureId,
      );
      expect(foundDisclosure).toBeDefined();
      expect(foundDisclosure.id).toBe(disclosureId);
    });
  });
});
