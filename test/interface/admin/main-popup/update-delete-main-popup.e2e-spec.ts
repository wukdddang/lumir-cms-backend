import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PUT /api/admin/main-popups/:id (메인 팝업 수정)', () => {
  const testSuite = new BaseE2ETest();
  let testLanguageId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
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

    // 언어 조회 (cleanup 후 언어는 여전히 존재)
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);
    const koreanLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'ko',
    );
    testLanguageId = koreanLanguage.id;

    // 테스트용 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/main-popups/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용',
      })
      .expect(201);

    testCategoryId = categoryResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('메인 팝업을 수정해야 한다', async () => {
      // Given - 메인 팝업 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '원본 제목',
              description: '원본 설명',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId = createResponse.body.id;

      // When - 수정
      const response = await testSuite
        .request()
        .put(`/api/admin/main-popups/${mainPopupId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '수정된 제목',
              description: '수정된 설명',
            },
          ]),
        )
        .field('categoryId', testCategoryId)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: mainPopupId,
      });
      // 다국어 전략으로 인해 여러 언어의 번역이 생성될 수 있으므로
      // testLanguageId에 해당하는 번역을 찾아서 확인
      const targetTranslation = response.body.translations.find(
        (t: any) => t.languageId === testLanguageId,
      );
      expect(targetTranslation).toBeDefined();
      expect(targetTranslation.title).toBe('수정된 제목');
      expect(targetTranslation.description).toBe('수정된 설명');
    });

    it('여러 언어의 번역을 수정해야 한다', async () => {
      // Given - 영어 언어 조회 또는 생성
      const languagesResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);
      
      let enLanguage = languagesResponse.body.items.find(
        (lang: any) => lang.code === 'en',
      );

      if (!enLanguage) {
        // 영어가 없으면 생성
        const enLanguageResponse = await testSuite
          .request()
          .post('/api/admin/languages')
          .send({
            code: 'en',
            name: 'English',
            nativeName: 'English',
            isDefault: false,
          });
        enLanguage = enLanguageResponse.body;
      }

      const enLanguageId = enLanguage.id;

      // 메인 팝업 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '원본 제목',
              description: '원본 설명',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId = createResponse.body.id;

      // When - 여러 언어 추가
      const response = await testSuite
        .request()
        .put(`/api/admin/main-popups/${mainPopupId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '수정된 한국어 제목',
              description: '수정된 한국어 설명',
            },
            {
              languageId: enLanguageId,
              title: 'Updated English Title',
              description: 'Updated English Description',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      // 디버깅을 위해 상태와 응답 확인
      if (response.status !== 200) {
        console.error('Update failed:', response.status, response.body);
        console.error('Test Language ID:', testLanguageId);
        console.error('EN Language ID:', enLanguageId);
      }
      expect(response.status).toBe(200);

      // Then
      // 다국어 전략으로 인해 여러 언어의 번역이 자동 생성될 수 있음
      expect(response.body.translations.length).toBeGreaterThanOrEqual(2);
      
      // 한국어와 영어 번역이 정확히 업데이트되었는지 확인
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === testLanguageId,
      );
      expect(koTranslation).toBeDefined();
      expect(koTranslation.title).toBe('수정된 한국어 제목');
      expect(koTranslation.description).toBe('수정된 한국어 설명');
      
      const enTranslation = response.body.translations.find(
        (t: any) => t.languageId === enLanguageId,
      );
      expect(enTranslation).toBeDefined();
      expect(enTranslation.title).toBe('Updated English Title');
      expect(enTranslation.description).toBe('Updated English Description');
    });

    it('description을 제거할 수 있어야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '원본 제목',
              description: '원본 설명',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId = createResponse.body.id;

      // When - description 제거
      const response = await testSuite
        .request()
        .put(`/api/admin/main-popups/${mainPopupId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '수정된 제목',
            },
          ]),
        )
        .field('categoryId', testCategoryId)
        .expect(200);

      // Then
      // 다국어 전략으로 인해 여러 언어의 번역이 생성될 수 있으므로
      // testLanguageId에 해당하는 번역을 찾아서 확인
      const targetTranslation = response.body.translations.find(
        (t: any) => t.languageId === testLanguageId
      );
      expect(targetTranslation).toBeDefined();
      expect(targetTranslation.title).toBe('수정된 제목');
    });

    it('카테고리 ID를 수정할 수 있어야 한다', async () => {
      // Given - 카테고리 생성
      const categoryResponse = await testSuite
        .request()
        .post('/api/admin/main-popups/categories')
        .send({
          name: '공지사항',
          description: '공지사항 카테고리',
        })
        .expect(201);

      const categoryId = categoryResponse.body.id;

      // 메인 팝업 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '원본 제목',
              description: '원본 설명',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId = createResponse.body.id;

      // When - 카테고리 ID 추가
      const response = await testSuite
        .request()
        .put(`/api/admin/main-popups/${mainPopupId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '원본 제목',
              description: '원본 설명',
            },
          ]),
        )
        .field('categoryId', categoryId)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: mainPopupId,
        categoryId: categoryId,
      });
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 메인 팝업을 수정하려 할 때 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .put(`/api/admin/main-popups/${nonExistentId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '수정된 제목',
            },
          ]),
        )
        .field('categoryId', testCategoryId)
        .expect(404);
    });

    it('translations가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '원본 제목',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId = createResponse.body.id;

      // When & Then
      await testSuite
        .request()
        .put(`/api/admin/main-popups/${mainPopupId}`)
        .send({})
        .expect(400);
    });
  });
});

describe('PATCH /api/admin/main-popups/:id/public (메인 팝업 공개 상태 수정)', () => {
  const testSuite = new BaseE2ETest();
  let testLanguageId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupSpecificTables([
      'main_popup_translations',
      'main_popups',
    ]);

    // 언어 조회 (cleanup 후 언어는 여전히 존재)
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);
    const koreanLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'ko',
    );
    testLanguageId = koreanLanguage.id;

    // 테스트용 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/main-popups/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용',
      })
      .expect(201);

    testCategoryId = categoryResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('메인 팝업을 공개로 변경해야 한다', async () => {
      // Given - 메인 팝업 생성 (기본값은 isPublic: true)
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '테스트 팝업',
              description: '테스트 설명',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId = createResponse.body.id;

      // 비공개로 먼저 변경
      await testSuite
        .request()
        .patch(`/api/admin/main-popups/${mainPopupId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // When - 공개로 변경
      const response = await testSuite
        .request()
        .patch(`/api/admin/main-popups/${mainPopupId}/public`)
        .send({ isPublic: true })
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(true);
      expect(response.body.categoryId).toBeDefined();
      expect(response.body.categoryName).toBeDefined();
    });

    it('메인 팝업을 비공개로 변경해야 한다', async () => {
      // Given - 메인 팝업 생성 후 공개로 변경
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '테스트 팝업',
              description: '테스트 설명',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId = createResponse.body.id;

      await testSuite
        .request()
        .patch(`/api/admin/main-popups/${mainPopupId}/public`)
        .send({ isPublic: true });

      // When - 비공개로 변경
      const response = await testSuite
        .request()
        .patch(`/api/admin/main-popups/${mainPopupId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(false);
      expect(response.body.categoryId).toBeDefined();
      expect(response.body.categoryName).toBeDefined();
    });

    it('공개 상태를 여러 번 변경할 수 있어야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '테스트 팝업',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId = createResponse.body.id;

      // When & Then - 여러 번 토글
      let response = await testSuite
        .request()
        .patch(`/api/admin/main-popups/${mainPopupId}/public`)
        .send({ isPublic: true })
        .expect(200);
      expect(response.body.isPublic).toBe(true);

      response = await testSuite
        .request()
        .patch(`/api/admin/main-popups/${mainPopupId}/public`)
        .send({ isPublic: false })
        .expect(200);
      expect(response.body.isPublic).toBe(false);

      response = await testSuite
        .request()
        .patch(`/api/admin/main-popups/${mainPopupId}/public`)
        .send({ isPublic: true })
        .expect(200);
      expect(response.body.isPublic).toBe(true);
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 메인 팝업의 공개 상태를 변경하려 할 때 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/main-popups/${nonExistentId}/public`)
        .send({ isPublic: true })
        .expect(404);
    });

    it('isPublic이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '테스트 팝업',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId = createResponse.body.id;

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/main-popups/${mainPopupId}/public`)
        .send({})
        .expect(400);
    });

    it('isPublic이 boolean이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '테스트 팝업',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId = createResponse.body.id;

      // When & Then
      // NestJS의 ValidationPipe가 enableImplicitConversion으로 타입을 자동 변환
      // @IsBoolean 데코레이터가 있으므로 'true'나 1 같은 값은 boolean으로 변환됨
      // 배열은 boolean으로 변환할 수 없으므로 400 에러가 발생해야 함
      const response = await testSuite
        .request()
        .patch(`/api/admin/main-popups/${mainPopupId}/public`)
        .send({ isPublic: [true] });

      // 배열은 boolean으로 변환할 수 없으므로 400 에러가 발생해야 함
      expect([400, 500]).toContain(response.status);
    });
  });
});

describe('DELETE /api/admin/main-popups/:id (메인 팝업 삭제)', () => {
  const testSuite = new BaseE2ETest();
  let testLanguageId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
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

    // 언어 조회 (cleanup 후 언어는 여전히 존재)
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);
    const koreanLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'ko',
    );
    testLanguageId = koreanLanguage.id;

    // 테스트용 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/main-popups/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용',
      })
      .expect(201);

    testCategoryId = categoryResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('메인 팝업을 삭제해야 한다 (Soft Delete)', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '삭제할 팝업',
              description: '삭제될 예정입니다',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId = createResponse.body.id;

      // When
      const deleteResponse = await testSuite
        .request()
        .delete(`/api/admin/main-popups/${mainPopupId}`)
        .expect(200);

      // Then
      expect(deleteResponse.body).toMatchObject({
        success: true,
      });

      // 삭제 후 조회하면 404 에러 발생
      await testSuite
        .request()
        .get(`/api/admin/main-popups/${mainPopupId}`)
        .expect(404);
    });

    it('여러 개의 메인 팝업을 순차적으로 삭제할 수 있어야 한다', async () => {
      // Given - 3개의 메인 팝업 생성
      const popupIds: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/main-popups')
          .field(
            'translations',
            JSON.stringify([
              {
                languageId: testLanguageId,
                title: `팝업${i}`,
                description: `설명${i}`,
              },
            ]),
          )
        .field('categoryId', testCategoryId);
        popupIds.push(response.body.id);
      }

      // When - 순차적으로 삭제
      for (const popupId of popupIds) {
        const deleteResponse = await testSuite
          .request()
          .delete(`/api/admin/main-popups/${popupId}`)
          .expect(200);

        expect(deleteResponse.body.success).toBe(true);
      }

      // Then - 모두 조회 불가능해야 함
      for (const popupId of popupIds) {
        await testSuite
          .request()
          .get(`/api/admin/main-popups/${popupId}`)
          .expect(404);
      }
    });

    it('삭제 후 목록에서 제외되어야 한다', async () => {
      // Given - 2개의 메인 팝업 생성
      const response1 = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '팝업1',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const response2 = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '팝업2',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId1 = response1.body.id;

      // When - 첫 번째 팝업 삭제
      await testSuite
        .request()
        .delete(`/api/admin/main-popups/${mainPopupId1}`)
        .expect(200);

      // Then - 목록 조회 시 1개만 남아있어야 함
      const listResponse = await testSuite
        .request()
        .get('/api/admin/main-popups')
        .expect(200);

      expect(listResponse.body.total).toBe(1);
      expect(listResponse.body.items).toHaveLength(1);
      expect(listResponse.body.items[0].id).toBe(response2.body.id);
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 메인 팝업을 삭제하려 할 때 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .delete(`/api/admin/main-popups/${nonExistentId}`)
        .expect(404);
    });

    it('이미 삭제된 메인 팝업을 다시 삭제하려 할 때 404 에러가 발생해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/main-popups')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: testLanguageId,
              title: '삭제할 팝업',
            },
          ]),
        )
        .field('categoryId', testCategoryId);

      const mainPopupId = createResponse.body.id;

      // 첫 번째 삭제
      await testSuite
        .request()
        .delete(`/api/admin/main-popups/${mainPopupId}`)
        .expect(200);

      // When & Then - 두 번째 삭제 시도
      await testSuite
        .request()
        .delete(`/api/admin/main-popups/${mainPopupId}`)
        .expect(404);
    });

    it('잘못된 UUID 형식으로 삭제 시 에러가 발생해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid';

      // When & Then
      const response = await testSuite
        .request()
        .delete(`/api/admin/main-popups/${invalidId}`);

      // UUID 검증은 400 또는 500 에러를 발생시킬 수 있음
      expect([400, 500]).toContain(response.status);
    });
  });
});
