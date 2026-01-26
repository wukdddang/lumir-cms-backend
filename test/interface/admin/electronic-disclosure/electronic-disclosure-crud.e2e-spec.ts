import { BaseE2ETest } from '../../../base-e2e.spec';

describe('전자공시 CRUD API', () => {
  const testSuite = new BaseE2ETest();
  let koreanLanguageId: string;
  let englishLanguageId: string;
  let japaneseLanguageId: string;
  let categoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
    
    // 각 테스트마다 언어 ID를 다시 조회 (cleanupBeforeTest가 DB를 초기화하므로)
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);

    const languages = languagesResponse.body.items;
    koreanLanguageId = languages.find((l: any) => l.code === 'ko')?.id;
    englishLanguageId = languages.find((l: any) => l.code === 'en')?.id;
    japaneseLanguageId = languages.find((l: any) => l.code === 'ja')?.id;

    expect(koreanLanguageId).toBeDefined();
    expect(englishLanguageId).toBeDefined();
    expect(japaneseLanguageId).toBeDefined();

    // 전자공시 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/electronic-disclosures/categories')
      .send({
        name: '테스트 카테고리',
        description: 'E2E 테스트용 카테고리',
        order: 0,
      })
      .expect(201);

    categoryId = categoryResponse.body.id;
  });

  describe('POST /api/admin/electronic-disclosures (전자공시 생성)', () => {
    it('한국어로 전자공시를 생성하면 다른 언어 번역이 자동 생성되어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '2024년 1분기 실적 공시',
              description: '2024년 1분기 실적 공시 자료입니다.',
            },
          ]),
        )
        .expect(201);

      // Then
      expect(response.body).toHaveProperty('id');
      expect(response.body.isPublic).toBe(true); // 기본값: true
      expect(response.body.order).toBe(0); // 첫 번째 전자공시
      expect(response.body.translations).toHaveLength(4); // ko, en, ja, zh

      // 한국어 번역 (수동 입력, isSynced=false)
      const koreanTranslation = response.body.translations.find(
        (t: any) => t.languageId === koreanLanguageId,
      );
      expect(koreanTranslation).toBeDefined();
      expect(koreanTranslation.title).toBe('2024년 1분기 실적 공시');
      expect(koreanTranslation.isSynced).toBe(false);

      // 영어 번역 (자동 생성, isSynced=true)
      const englishTranslation = response.body.translations.find(
        (t: any) => t.languageId === englishLanguageId,
      );
      expect(englishTranslation).toBeDefined();
      expect(englishTranslation.title).toBe('2024년 1분기 실적 공시'); // 한국어 복사
      expect(englishTranslation.isSynced).toBe(true); // 자동 동기화 대상
    });

    it('여러 언어로 전자공시를 생성하면 나머지 언어만 자동 생성되어야 한다', async () => {
      // When - 한국어, 영어 수동 입력
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '2024년 2분기 실적 공시',
              description: '한국어 설명',
            },
            {
              languageId: englishLanguageId,
              title: 'Q2 2024 Earnings Disclosure',
              description: 'English description',
            },
          ]),
        )
        .expect(201);

      // Then
      expect(response.body.translations).toHaveLength(4); // ko, en, ja, zh

      // 한국어, 영어: isSynced=false
      const koreanTranslation = response.body.translations.find(
        (t: any) => t.languageId === koreanLanguageId,
      );
      expect(koreanTranslation.isSynced).toBe(false);

      const englishTranslation = response.body.translations.find(
        (t: any) => t.languageId === englishLanguageId,
      );
      expect(englishTranslation.title).toBe('Q2 2024 Earnings Disclosure');
      expect(englishTranslation.isSynced).toBe(false);

      // 일본어: isSynced=true (자동 생성, 한국어 복사)
      const japaneseTranslation = response.body.translations.find(
        (t: any) => t.languageId === japaneseLanguageId,
      );
      expect(japaneseTranslation.title).toBe('2024년 2분기 실적 공시');
      expect(japaneseTranslation.isSynced).toBe(true);
    });

    it('translations 필드가 없으면 400 에러를 반환해야 한다', async () => {
      // When & Then
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .expect(400);

      // multipart/form-data 요청이 아닌 경우 '요청 본문이 필요합니다' 에러 발생
      expect(response.body.message).toContain('요청 본문이 필요합니다');
    });

    it('title이 없으면 400 에러를 반환해야 한다', async () => {
      // When & Then
      const response = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              description: '설명만 있음',
            },
          ]),
        )
        .expect(400);

      expect(response.body.message).toContain('title');
    });
  });

  describe('GET /api/admin/electronic-disclosures (전자공시 목록 조회)', () => {
    it('빈 목록을 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures')
        .expect(200);

      // Then
      expect(response.body.items).toEqual([]);
      expect(response.body.total).toBe(0);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
    });

    it('전자공시 목록을 조회해야 한다', async () => {
      // Given - 3개 생성
      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '전자공시 1',
            },
          ]),
        )
        .expect(201);

      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '전자공시 2',
            },
          ]),
        )
        .expect(201);

      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '전자공시 3',
            },
          ]),
        )
        .expect(201);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(3);
      expect(response.body.total).toBe(3);
      expect(response.body.items[0].title).toBe('전자공시 1');
      expect(response.body.items[1].title).toBe('전자공시 2');
      expect(response.body.items[2].title).toBe('전자공시 3');
    });

    it('페이징 처리가 되어야 한다', async () => {
      // Given - 15개 생성
      for (let i = 1; i <= 15; i++) {
        await testSuite
          .request()
          .post('/api/admin/electronic-disclosures')
          .field('categoryId', categoryId)
          .field(
            'translations',
            JSON.stringify([
              {
                languageId: koreanLanguageId,
                title: `전자공시 ${i}`,
              },
            ]),
          )
          .expect(201);
      }

      // When - 페이지 1 (limit 10)
      const page1Response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures?page=1&limit=10')
        .expect(200);

      // Then
      expect(page1Response.body.items).toHaveLength(10);
      expect(page1Response.body.total).toBe(15);
      expect(page1Response.body.page).toBe(1);
      expect(page1Response.body.totalPages).toBe(2);

      // When - 페이지 2
      const page2Response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures?page=2&limit=10')
        .expect(200);

      // Then
      expect(page2Response.body.items).toHaveLength(5);
      expect(page2Response.body.page).toBe(2);
    });

    it('공개 여부로 필터링해야 한다', async () => {
      // Given
      const disclosure1 = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '공개 전자공시',
            },
          ]),
        )
        .expect(201);

      // 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosure1.body.id}/public`)
        .send({ isPublic: false })
        .expect(200);

      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '공개 전자공시 2',
            },
          ]),
        )
        .expect(201);

      // When - 공개만 조회
      const publicResponse = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures?isPublic=true')
        .expect(200);

      // Then
      expect(publicResponse.body.items).toHaveLength(1);
      expect(publicResponse.body.items[0].title).toBe('공개 전자공시 2');

      // When - 비공개만 조회
      const privateResponse = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures?isPublic=false')
        .expect(200);

      // Then
      expect(privateResponse.body.items).toHaveLength(1);
      expect(privateResponse.body.items[0].title).toBe('공개 전자공시');
    });
  });

  describe('GET /api/admin/electronic-disclosures/:id (전자공시 상세 조회)', () => {
    it('전자공시 상세를 조회해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '상세 조회 테스트',
              description: '상세 조회 설명',
            },
          ]),
        )
        .expect(201);

      const disclosureId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      // Then
      expect(response.body.id).toBe(disclosureId);
      expect(response.body.isPublic).toBe(true);
      expect(response.body.categoryId).toBe(categoryId);
      expect(response.body.categoryName).toBe('재무 정보');
      expect(response.body.translations).toHaveLength(4);

      const koreanTranslation = response.body.translations.find(
        (t: any) => t.languageId === koreanLanguageId,
      );
      expect(koreanTranslation.title).toBe('상세 조회 테스트');
      expect(koreanTranslation.description).toBe('상세 조회 설명');
    });

    it('존재하지 않는 전자공시를 조회하면 404 에러를 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });

    it('잘못된 UUID 형식이면 400 에러를 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/invalid-uuid')
        .expect(400);
    });
  });

  describe('PUT /api/admin/electronic-disclosures/:id (전자공시 수정)', () => {
    it('전자공시 번역을 수정하면 isSynced가 false로 변경되어야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '원본 제목',
              description: '원본 설명',
            },
          ]),
        )
        .expect(201);

      const disclosureId = createResponse.body.id;

      // 영어 번역은 자동 생성되어 isSynced=true
      const englishTranslation = createResponse.body.translations.find(
        (t: any) => t.languageId === englishLanguageId,
      );
      expect(englishTranslation.isSynced).toBe(true);

      // When - 영어 번역 수정
      const updateResponse = await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: englishLanguageId,
              title: 'Modified English Title',
              description: 'Modified description',
            },
          ]),
        )
        .expect(200);

      // Then - 수정된 영어 번역의 isSynced가 false로 변경
      const updatedEnglishTranslation = updateResponse.body.translations.find(
        (t: any) => t.languageId === englishLanguageId,
      );
      expect(updatedEnglishTranslation.title).toBe('Modified English Title');
      expect(updatedEnglishTranslation.isSynced).toBe(false); // 동기화 중단

      // 한국어는 변경 없음
      const koreanTranslation = updateResponse.body.translations.find(
        (t: any) => t.languageId === koreanLanguageId,
      );
      expect(koreanTranslation.title).toBe('원본 제목');
      expect(koreanTranslation.isSynced).toBe(false); // 원래부터 false

      // 일본어는 여전히 isSynced=true (수정 안 함)
      const japaneseTranslation = updateResponse.body.translations.find(
        (t: any) => t.languageId === japaneseLanguageId,
      );
      expect(japaneseTranslation.isSynced).toBe(true);
    });

    it('한국어 번역을 수정해도 isSynced는 false로 유지되어야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '원본 한국어 제목',
            },
          ]),
        )
        .expect(201);

      const disclosureId = createResponse.body.id;

      // When - 한국어 번역 수정
      const updateResponse = await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '수정된 한국어 제목',
            },
          ]),
        )
        .expect(200);

      // Then
      const koreanTranslation = updateResponse.body.translations.find(
        (t: any) => t.languageId === koreanLanguageId,
      );
      expect(koreanTranslation.title).toBe('수정된 한국어 제목');
      expect(koreanTranslation.isSynced).toBe(false);
    });

    it('존재하지 않는 전자공시를 수정하면 404 에러를 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/electronic-disclosures/00000000-0000-0000-0000-000000000001')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '수정',
            },
          ]),
        )
        .expect(404);
    });
  });

  describe('PATCH /api/admin/electronic-disclosures/:id/public (공개 상태 수정)', () => {
    it('전자공시를 비공개로 변경해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '공개 테스트',
            },
          ]),
        )
        .expect(201);

      const disclosureId = createResponse.body.id;
      expect(createResponse.body.isPublic).toBe(true); // 기본값

      // When - 비공개로 변경
      const updateResponse = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then
      expect(updateResponse.body.isPublic).toBe(false);

      // 다시 조회해서 확인
      const getResponse = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      expect(getResponse.body.isPublic).toBe(false);
    });

    it('전자공시를 공개로 변경해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '비공개 테스트',
            },
          ]),
        )
        .expect(201);

      const disclosureId = createResponse.body.id;

      // 먼저 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // When - 공개로 변경
      const updateResponse = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureId}/public`)
        .send({ isPublic: true })
        .expect(200);

      // Then
      expect(updateResponse.body.isPublic).toBe(true);
    });
  });

  describe('PUT /api/admin/electronic-disclosures/batch-order (오더 일괄 수정)', () => {
    it('여러 전자공시의 순서를 일괄 수정해야 한다', async () => {
      // Given - 3개 생성
      const disclosure1 = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '전자공시 1',
            },
          ]),
        )
        .expect(201);

      const disclosure2 = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '전자공시 2',
            },
          ]),
        )
        .expect(201);

      const disclosure3 = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '전자공시 3',
            },
          ]),
        )
        .expect(201);

      // When - 순서 변경 (3 -> 1 -> 2)
      const response = await testSuite
        .request()
        .put('/api/admin/electronic-disclosures/batch-order')
        .send({
          electronicDisclosures: [
            { id: disclosure3.body.id, order: 0 },
            { id: disclosure1.body.id, order: 1 },
            { id: disclosure2.body.id, order: 2 },
          ],
        })
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.updatedCount).toBe(3);

      // 목록 조회해서 순서 확인
      const listResponse = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures?orderBy=order')
        .expect(200);

      expect(listResponse.body.items[0].id).toBe(disclosure3.body.id);
      expect(listResponse.body.items[1].id).toBe(disclosure1.body.id);
      expect(listResponse.body.items[2].id).toBe(disclosure2.body.id);
    });

    it('빈 배열로 요청하면 400 에러를 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/electronic-disclosures/batch-order')
        .send({
          electronicDisclosures: [],
        })
        .expect(400);
    });
  });

  describe('DELETE /api/admin/electronic-disclosures/:id (전자공시 삭제)', () => {
    it('전자공시를 삭제해야 한다 (Soft Delete)', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '삭제 테스트',
            },
          ]),
        )
        .expect(201);

      const disclosureId = createResponse.body.id;

      // When
      const deleteResponse = await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      // Then
      expect(deleteResponse.body.success).toBe(true);

      // 조회하면 404
      await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(404);
    });

    it('존재하지 않는 전자공시를 삭제하면 404 에러를 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .delete('/api/admin/electronic-disclosures/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });
  });

  describe('GET /api/admin/electronic-disclosures/all (전체 목록 조회)', () => {
    it('모든 전자공시를 페이징 없이 조회해야 한다', async () => {
      // Given - 3개 생성
      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '전자공시 1',
            },
          ]),
        )
        .expect(201);

      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '전자공시 2',
            },
          ]),
        )
        .expect(201);

      await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '전자공시 3',
            },
          ]),
        )
        .expect(201);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/all')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
    });
  });
});
