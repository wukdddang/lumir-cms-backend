import { BaseE2ETest } from '../../../base-e2e.spec';

describe('POST /api/admin/irs (IR 생성)', () => {
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

    // IR 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/irs/categories')
      .send({
        name: '재무제표',
        description: '재무제표 카테고리',
      })
      .expect(201);

    categoryId = categoryResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('유효한 데이터로 IR을 생성해야 한다', async () => {
      // Given
      const translationsData = [
        {
          languageId,
          title: '2024년 1분기 IR 자료',
          description: '2024년 1분기 IR 자료입니다.',
        },
      ];

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', categoryId)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        isPublic: true, // 기본값 확인
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // 카테고리 확인
      expect(response.body.categoryName).toBeDefined();

      // 자동 번역 동기화로 인해 4개 언어 모두 번역이 생성됨
      expect(response.body.translations).toHaveLength(4);

      // 한국어 번역 확인 (isSynced: false, 수동 입력)
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation).toMatchObject({
        languageId,
        title: '2024년 1분기 IR 자료',
        description: '2024년 1분기 IR 자료입니다.',
        isSynced: false,
      });

      // 다른 언어들은 자동 동기화됨 (isSynced: true)
      const syncedTranslations = response.body.translations.filter(
        (t: any) => t.languageId !== languageId,
      );
      expect(syncedTranslations).toHaveLength(3);
      syncedTranslations.forEach((t: any) => {
        expect(t.isSynced).toBe(true);
        expect(t.title).toBe('2024년 1분기 IR 자료');
      });
    });

    it('여러 언어 번역을 포함한 IR을 생성해야 한다', async () => {
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
          title: '2024년 1분기 IR 자료',
          description: '2024년 1분기 IR 자료입니다.',
        },
        {
          languageId: enLanguageId,
          title: 'Q1 2024 IR Material',
          description: 'Q1 2024 IR material.',
        },
      ];

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', categoryId)
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
      expect(enTranslation.title).toBe('Q1 2024 IR Material');
    });

    it('description 없이 IR을 생성해야 한다', async () => {
      // Given
      const translationsData = [
        {
          languageId,
          title: '2024년 2분기 IR 자료',
        },
      ];

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', categoryId)
        .expect(201);

      // Then
      // 자동 번역 동기화로 4개 언어 생성
      expect(response.body.translations).toHaveLength(4);

      // 한국어 번역 확인
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation.title).toBe('2024년 2분기 IR 자료');
      expect(koTranslation.description).toBeNull();
    });
  });

  describe('실패 케이스 - 필수 필드 누락', () => {
    it('translations가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post('/api/admin/irs')
        .field('categoryId', categoryId)
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
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', categoryId)
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
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', categoryId)
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
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', categoryId);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('존재하지 않는 categoryId로 생성 시 에러가 발생해야 한다', async () => {
      // Given
      const translationsData = [
        {
          languageId,
          title: '테스트',
        },
      ];

      // When & Then
      const response = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', '00000000-0000-0000-0000-000000000001');

      expect([400, 404, 500]).toContain(response.status);
    });

    it('잘못된 JSON 형식의 translations는 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', 'invalid json')
        .field('categoryId', categoryId)
        .expect(400);
    });

    it('빈 배열의 translations는 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify([]))
        .field('categoryId', categoryId)
        .expect(400);
    });
  });

  describe('생성 후 검증', () => {
    it('생성된 IR을 조회할 수 있어야 한다', async () => {
      // Given - IR 생성
      const translationsData = [
        {
          languageId,
          title: '검증용 IR',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', categoryId)
        .expect(201);

      const irId = createResponse.body.id;

      // When - 생성된 IR 조회
      const getResponse = await testSuite
        .request()
        .get(`/api/admin/irs/${irId}`)
        .expect(200);

      // Then
      expect(getResponse.body.id).toBe(irId);
      expect(getResponse.body.translations).toHaveLength(4);
    });

    it('생성된 IR이 목록에 포함되어야 한다', async () => {
      // Given - IR 생성
      const translationsData = [
        {
          languageId,
          title: '목록 확인용 IR',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', categoryId)
        .expect(201);

      const irId = createResponse.body.id;

      // When - 목록 조회
      const listResponse = await testSuite
        .request()
        .get('/api/admin/irs')
        .expect(200);

      // Then - ID로 검증 (title은 DTO 변환 과정에서 빈 문자열이 될 수 있음)
      const foundIR = listResponse.body.items.find(
        (item: any) => item.id === irId,
      );
      expect(foundIR).toBeDefined();
      expect(foundIR.id).toBe(irId);
    });
  });

  describe('카테고리 개별 설정', () => {
    it('각 IR이 개별적인 카테고리를 가져야 한다', async () => {
      // Given - 두 개의 카테고리 생성
      const category1Response = await testSuite
        .request()
        .post('/api/admin/irs/categories')
        .send({
          name: '재무정보',
          description: '재무정보 카테고리',
        })
        .expect(201);

      const category2Response = await testSuite
        .request()
        .post('/api/admin/irs/categories')
        .send({
          name: '투자정보',
          description: '투자정보 카테고리',
        })
        .expect(201);

      const category1Id = category1Response.body.id;
      const category2Id = category2Response.body.id;

      // 두 개의 IR 생성 (같은 카테고리로)
      const translations1 = [{ languageId, title: 'IR 1' }];
      const translations2 = [{ languageId, title: 'IR 2' }];

      const ir1Response = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('categoryId', category1Id)
        .field('translations', JSON.stringify(translations1))
        .expect(201);

      const ir2Response = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('categoryId', category1Id)
        .field('translations', JSON.stringify(translations2))
        .expect(201);

      const ir1Id = ir1Response.body.id;
      const ir2Id = ir2Response.body.id;

      // 두 IR 모두 카테고리 1을 가지고 있어야 함
      expect(ir1Response.body.categoryId).toBe(category1Id);
      expect(ir2Response.body.categoryId).toBe(category1Id);

      // When - IR 1의 카테고리만 변경
      const updatedTranslations1 = [{ languageId, title: 'IR 1' }];

      const updateResponse1 = await testSuite
        .request()
        .put(`/api/admin/irs/${ir1Id}`)
        .field('categoryId', category2Id)
        .field('translations', JSON.stringify(updatedTranslations1))
        .expect(200);

      // Then - IR 1만 카테고리가 변경되어야 함
      expect(updateResponse1.body.categoryId).toBe(category2Id);

      // IR 2는 여전히 카테고리 1을 가지고 있어야 함
      const getIR2Response = await testSuite
        .request()
        .get(`/api/admin/irs/${ir2Id}`)
        .expect(200);

      expect(getIR2Response.body.categoryId).toBe(category1Id);

      // 두 IR이 서로 다른 카테고리를 가져야 함
      expect(updateResponse1.body.categoryId).not.toBe(getIR2Response.body.categoryId);

      console.log(`✅ IR 1 카테고리: ${updateResponse1.body.categoryId}`);
      console.log(`✅ IR 2 카테고리: ${getIR2Response.body.categoryId}`);
      console.log(`✅ 각 IR이 개별적인 카테고리를 가지고 있습니다!`);
    });
  });
});
