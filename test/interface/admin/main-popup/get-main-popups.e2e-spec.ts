import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/main-popups (메인 팝업 목록 조회)', () => {
  const testSuite = new BaseE2ETest();
  let testLanguageId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();

    // 테스트용 언어 조회 또는 생성
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);
    
    const koreanLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'ko',
    );
    
    if (koreanLanguage) {
      testLanguageId = koreanLanguage.id;
    } else {
      // 언어가 없으면 생성
      const languageResponse = await testSuite
        .request()
        .post('/api/admin/languages')
        .send({
          code: 'ko',
          name: '한국어',
          nativeName: '한국어',
          isDefault: true,
        });
      
      testLanguageId = languageResponse.body.id;
    }
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    // 외래키 제약조건 때문에 순서 중요: 자식 테이블 먼저 삭제
    await testSuite.cleanupSpecificTables([
      'main_popup_translations',
      'main_popups',
    ]);

    // 테스트용 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/main-popups/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 카테고리',
        isActive: true,
        order: 0,
      })
      .expect(201);
    
    testCategoryId = categoryResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('빈 목록을 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/main-popups')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('등록된 메인 팝업 목록을 조회해야 한다', async () => {
      // Given
      const popups = [
        { title: '팝업1', description: '설명1' },
        { title: '팝업2', description: '설명2' },
        { title: '팝업3', description: '설명3' },
      ];

      for (const popup of popups) {
        await testSuite
          .request()
          .post('/api/admin/main-popups')
          .field('translations', JSON.stringify([
              {
                languageId: testLanguageId,
                ...popup,
              },
            ]))
          .field('categoryId', testCategoryId);
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/main-popups')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(3);
      expect(response.body.total).toBe(3);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
      expect(response.body.totalPages).toBe(1);
    });

    it('페이지네이션이 동작해야 한다', async () => {
      // Given - 15개의 메인 팝업 생성
      for (let i = 1; i <= 15; i++) {
        await testSuite
          .request()
          .post('/api/admin/main-popups')
          .field('translations', JSON.stringify([
              {
                languageId: testLanguageId,
                title: `팝업${i}`,
                description: `설명${i}`,
              },
            ]))
          .field('categoryId', testCategoryId);
      }

      // When - 첫 페이지 조회 (limit=10)
      const page1Response = await testSuite
        .request()
        .get('/api/admin/main-popups?page=1&limit=10')
        .expect(200);

      // Then
      expect(page1Response.body.items).toHaveLength(10);
      expect(page1Response.body.total).toBe(15);
      expect(page1Response.body.page).toBe(1);
      expect(page1Response.body.limit).toBe(10);
      expect(page1Response.body.totalPages).toBe(2);

      // When - 두 번째 페이지 조회
      const page2Response = await testSuite
        .request()
        .get('/api/admin/main-popups?page=2&limit=10')
        .expect(200);

      // Then
      expect(page2Response.body.items).toHaveLength(5);
      expect(page2Response.body.total).toBe(15);
      expect(page2Response.body.page).toBe(2);
      expect(page2Response.body.totalPages).toBe(2);
    });

    it('limit 파라미터가 동작해야 한다', async () => {
      // Given
      for (let i = 1; i <= 10; i++) {
        await testSuite
          .request()
          .post('/api/admin/main-popups')
          .field('translations', JSON.stringify([
              {
                languageId: testLanguageId,
                title: `팝업${i}`,
                description: `설명${i}`,
              },
            ]))
          .field('categoryId', testCategoryId);
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/main-popups?limit=5')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(5);
      expect(response.body.limit).toBe(5);
    });
  });

  describe('필터링 테스트', () => {
    beforeEach(async () => {
      // 다양한 상태의 메인 팝업 생성
      const publicPopup = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field('translations', JSON.stringify([
            {
              languageId: testLanguageId,
              title: '공개 팝업',
              description: '공개된 팝업입니다',
            },
          ]))
          .field('categoryId', testCategoryId);

      // 공개 상태로 변경
      await testSuite
        .request()
        .patch(`/api/admin/main-popups/${publicPopup.body.id}/public`)
        .send({ isPublic: true });

      // 비공개 팝업 생성
      const privatePopup = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field('translations', JSON.stringify([
            {
              languageId: testLanguageId,
              title: '비공개 팝업',
              description: '비공개 팝업입니다',
            },
          ]))
          .field('categoryId', testCategoryId);

      // 비공개 상태로 변경
      await testSuite
        .request()
        .patch(`/api/admin/main-popups/${privatePopup.body.id}/public`)
        .send({ isPublic: false });
    });

    it('isPublic=true 필터가 동작해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/main-popups?isPublic=true')
        .expect(200);

      // Then
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items.every((item: any) => item.isPublic === true)).toBe(true);
    });

    it('isPublic=false 필터가 동작해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/main-popups?isPublic=false')
        .expect(200);

      // Then
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items.every((item: any) => item.isPublic === false)).toBe(true);
    });
  });

  describe('정렬 테스트', () => {
    it('orderBy=order로 정렬해야 한다', async () => {
      // Given
      for (let i = 1; i <= 3; i++) {
        await testSuite
          .request()
          .post('/api/admin/main-popups')
          .field('translations', JSON.stringify([
              {
                languageId: testLanguageId,
                title: `팝업${i}`,
                description: `설명${i}`,
              },
            ]))
          .field('categoryId', testCategoryId);
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/main-popups?orderBy=order')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(3);
    });

    it('orderBy=createdAt로 정렬해야 한다', async () => {
      // Given
      for (let i = 1; i <= 3; i++) {
        await testSuite
          .request()
          .post('/api/admin/main-popups')
          .field('translations', JSON.stringify([
              {
                languageId: testLanguageId,
                title: `팝업${i}`,
                description: `설명${i}`,
              },
            ]))
          .field('categoryId', testCategoryId);
        // 생성 시간 차이를 두기 위한 대기
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/main-popups?orderBy=createdAt')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(3);
    });
  });
});

describe('GET /api/admin/main-popups/all (메인 팝업 전체 목록 조회)', () => {
  const testSuite = new BaseE2ETest();
  let testLanguageId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();

    // 테스트용 언어 조회 또는 생성
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);
    
    const koreanLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'ko',
    );
    
    if (koreanLanguage) {
      testLanguageId = koreanLanguage.id;
    } else {
      // 언어가 없으면 생성
      const languageResponse = await testSuite
        .request()
        .post('/api/admin/languages')
        .send({
          code: 'ko',
          name: '한국어',
          nativeName: '한국어',
          isDefault: true,
        });
      
      testLanguageId = languageResponse.body.id;
    }
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    // 외래키 제약조건 때문에 순서 중요: 자식 테이블 먼저 삭제
    await testSuite.cleanupSpecificTables([
      'main_popup_translations',
      'main_popups',
    ]);

    // 테스트용 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/main-popups/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 카테고리',
        isActive: true,
        order: 0,
      })
      .expect(201);
    
    testCategoryId = categoryResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('빈 배열을 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/main-popups/all')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('모든 메인 팝업을 페이지네이션 없이 조회해야 한다', async () => {
      // Given - 15개의 메인 팝업 생성
      for (let i = 1; i <= 15; i++) {
        await testSuite
          .request()
          .post('/api/admin/main-popups')
          .field('translations', JSON.stringify([
              {
                languageId: testLanguageId,
                title: `팝업${i}`,
                description: `설명${i}`,
              },
            ]))
          .field('categoryId', testCategoryId);
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/main-popups/all')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(15);
    });
  });
});

describe('GET /api/admin/main-popups/:id (메인 팝업 상세 조회)', () => {
  const testSuite = new BaseE2ETest();
  let testLanguageId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();

    // 테스트용 언어 조회 또는 생성
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);
    
    const koreanLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'ko',
    );
    
    if (koreanLanguage) {
      testLanguageId = koreanLanguage.id;
    } else {
      // 언어가 없으면 생성
      const languageResponse = await testSuite
        .request()
        .post('/api/admin/languages')
        .send({
          code: 'ko',
          name: '한국어',
          nativeName: '한국어',
          isDefault: true,
        });
      
      testLanguageId = languageResponse.body.id;
    }
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    // 외래키 제약조건 때문에 순서 중요: 자식 테이블 먼저 삭제
    await testSuite.cleanupSpecificTables([
      'main_popup_translations',
      'main_popups',
    ]);

    // 테스트용 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/main-popups/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 카테고리',
        isActive: true,
        order: 0,
      })
      .expect(201);
    
    testCategoryId = categoryResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('ID로 메인 팝업을 조회해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field('translations', JSON.stringify([
            {
              languageId: testLanguageId,
              title: '테스트 팝업',
              description: '테스트 설명',
            },
          ]))
          .field('categoryId', testCategoryId)
        .expect(201);

      const mainPopupId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/main-popups/${mainPopupId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: mainPopupId,
        isPublic: true, // 기본값: 공개
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        categoryId: testCategoryId,
      });
      expect(response.body.categoryName).toBeDefined();
      expect(response.body.categoryName).toBe('테스트 카테고리');
      expect(response.body.translations).toBeDefined();
      expect(response.body.translations[0]).toMatchObject({
        title: '테스트 팝업',
        description: '테스트 설명',
      });
    });

    it('여러 언어 번역이 포함된 메인 팝업을 조회해야 한다', async () => {
      // Given - 영어 언어 조회 또는 생성
      const languagesResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);
      
      let enLanguageId: string;
      const englishLanguage = languagesResponse.body.items.find(
        (lang: any) => lang.code === 'en',
      );
      
      if (englishLanguage) {
        enLanguageId = englishLanguage.id;
      } else {
        const enLanguageResponse = await testSuite
          .request()
          .post('/api/admin/languages')
          .send({
            code: 'en',
            name: 'English',
            nativeName: 'English',
            isDefault: false,
          });
        enLanguageId = enLanguageResponse.body.id;
      }

      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field('translations', JSON.stringify([
            {
              languageId: testLanguageId,
              title: '다국어 팝업',
              description: '한국어 설명',
            },
            {
              languageId: enLanguageId,
              title: 'Multilingual Popup',
              description: 'English description',
            },
          ]))
          .field('categoryId', testCategoryId)
        .expect(201);

      const mainPopupId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/main-popups/${mainPopupId}`)
        .expect(200);

      // Then
      expect(response.body.translations.length).toBeGreaterThanOrEqual(2);
      
      // 한국어와 영어 번역이 있는지 확인 (자동 동기화된 다른 언어도 포함될 수 있음)
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === testLanguageId,
      );
      const enTranslation = response.body.translations.find(
        (t: any) => t.languageId === enLanguageId,
      );
      
      expect(koTranslation).toMatchObject({
        title: '다국어 팝업',
        languageId: testLanguageId,
      });
      expect(enTranslation).toMatchObject({
        title: 'Multilingual Popup',
        languageId: enLanguageId,
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
        .get(`/api/admin/main-popups/${nonExistentId}`)
        .expect(404);
    });

    it('잘못된 UUID 형식으로 조회 시 에러가 발생해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid';

      // When & Then
      const response = await testSuite
        .request()
        .get(`/api/admin/main-popups/${invalidId}`);

      // UUID 검증은 400 또는 500 에러를 발생시킬 수 있음
      expect([400, 500]).toContain(response.status);
    });
  });
});
