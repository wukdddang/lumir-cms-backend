import { BaseE2ETest } from '../../../base-e2e.spec';

describe('브로슈어 수정/삭제 (E2E)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;
  let categoryId: string;
  let brochureId: string;

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

    // 테스트용 브로슈어 생성
    const brochureResponse = await testSuite
      .request()
      .post('/api/admin/brochures')
      .send({
        translations: [
          {
            languageId,
            title: '테스트 브로슈어',
            description: '테스트 설명',
          },
        ],
        categoryId,
      });
    brochureId = brochureResponse.body.id;
  });

  describe('PUT /api/admin/brochures/:id - 브로슈어 수정', () => {
    it('브로슈어를 수정할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/brochures/${brochureId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId,
              title: '수정된 제목',
              description: '수정된 설명',
            },
          ]),
        )
        .expect(200);

      // Then
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        title: '수정된 제목',
        description: '수정된 설명',
        isSynced: false, // 수정 시 동기화 중단 확인
      });
    });

    it('제목만 수정할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/brochures/${brochureId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId,
              title: '제목만 수정',
            },
          ]),
        )
        .expect(200);

      // Then
      expect(response.body[0].title).toBe('제목만 수정');
      expect(response.body[0].isSynced).toBe(false); // 수정 시 동기화 중단
    });

    it('존재하지 않는 브로슈어를 수정하면 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/brochures/00000000-0000-0000-0000-000000000001')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId,
              title: '수정 시도',
            },
          ]),
        )
        .expect(404);
    });

    it('translations가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put(`/api/admin/brochures/${brochureId}`)
        .expect(400);
    });
  });

  describe('PATCH /api/admin/brochures/:id/public - 브로슈어 공개 상태 수정', () => {
    it('브로슈어를 비공개로 변경할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/brochures/${brochureId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(false);
    });

    it('브로슈어를 공개로 변경할 수 있어야 한다', async () => {
      // Given - 먼저 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/brochures/${brochureId}/public`)
        .send({ isPublic: false });

      // When - 다시 공개로 변경
      const response = await testSuite
        .request()
        .patch(`/api/admin/brochures/${brochureId}/public`)
        .send({ isPublic: true })
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(true);
    });

    it('존재하지 않는 브로슈어의 공개 상태를 변경하면 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .patch('/api/admin/brochures/00000000-0000-0000-0000-000000000001/public')
        .send({ isPublic: false })
        .expect(404);
    });

    it('isPublic이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/brochures/${brochureId}/public`)
        .send({})
        .expect(400);
    });
  });

  describe('DELETE /api/admin/brochures/:id - 브로슈어 삭제', () => {
    it('브로슈어를 삭제할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .delete(`/api/admin/brochures/${brochureId}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
    });

    it('삭제된 브로슈어는 조회되지 않아야 한다', async () => {
      // Given - 브로슈어 삭제
      await testSuite
        .request()
        .delete(`/api/admin/brochures/${brochureId}`)
        .expect(200);

      // When & Then - 삭제된 브로슈어 조회 시도
      await testSuite
        .request()
        .get(`/api/admin/brochures/${brochureId}`)
        .expect(404);
    });

    it('삭제된 브로슈어는 목록에 나타나지 않아야 한다', async () => {
      // Given - 브로슈어 삭제
      await testSuite
        .request()
        .delete(`/api/admin/brochures/${brochureId}`)
        .expect(200);

      // When - 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/brochures')
        .expect(200);

      // Then
      const found = response.body.items.find((b: any) => b.id === brochureId);
      expect(found).toBeUndefined();
    });

    it('존재하지 않는 브로슈어를 삭제하면 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .delete('/api/admin/brochures/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });

    it('이미 삭제된 브로슈어를 다시 삭제하면 404 에러가 발생해야 한다', async () => {
      // Given - 브로슈어 삭제
      await testSuite
        .request()
        .delete(`/api/admin/brochures/${brochureId}`)
        .expect(200);

      // When & Then - 다시 삭제 시도
      await testSuite
        .request()
        .delete(`/api/admin/brochures/${brochureId}`)
        .expect(404);
    });
  });

  describe('브로슈어 수정 후 삭제', () => {
    it('수정한 브로슈어를 삭제할 수 있어야 한다', async () => {
      // Given - 브로슈어 수정
      await testSuite
        .request()
        .put(`/api/admin/brochures/${brochureId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId,
              title: '수정된 후 삭제될 브로슈어',
            },
          ]),
        )
        .expect(200);

      // When - 삭제
      const response = await testSuite
        .request()
        .delete(`/api/admin/brochures/${brochureId}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
    });
  });

  describe('브로슈어 isSynced 정책 검증 (ERD 정책)', () => {
    it('생성 시: 입력 언어는 isSynced=false, 미입력 언어는 isSynced=true', async () => {
      // Given - 한국어만 입력하여 브로슈어 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/brochures')
        .send({
          translations: [
            {
              languageId,
              title: 'isSynced 정책 테스트',
              description: '정책 검증용 브로슈어',
            },
          ],
          categoryId,
        })
        .expect(201);

      const newBrochureId = createResponse.body.id;

      // When - 브로슈어 상세 조회
      const detailResponse = await testSuite
        .request()
        .get(`/api/admin/brochures/${newBrochureId}`)
        .expect(200);

      // Then - 입력한 한국어는 isSynced=false
      const koTranslation = detailResponse.body.translations.find(
        (t: any) => t.language.code === 'ko',
      );
      expect(koTranslation).toBeDefined();
      expect(koTranslation.isSynced).toBe(false);

      // Then - 나머지 언어들은 isSynced=true (자동 동기화 대상)
      const otherTranslations = detailResponse.body.translations.filter(
        (t: any) => t.language.code !== 'ko',
      );
      expect(otherTranslations.length).toBeGreaterThan(0);
      otherTranslations.forEach((t: any) => {
        expect(t.isSynced).toBe(true);
      });

      // 정리
      await testSuite
        .request()
        .delete(`/api/admin/brochures/${newBrochureId}`)
        .expect(200);
    });

    it('수정 시: isSynced가 false로 변경되어 자동 동기화에서 제외됨', async () => {
      // Given - 브로슈어 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/brochures')
        .send({
          translations: [
            {
              languageId,
              title: '원본 제목',
            },
          ],
          categoryId,
        })
        .expect(201);

      const newBrochureId = createResponse.body.id;

      // When - 브로슈어 수정
      const updateResponse = await testSuite
        .request()
        .put(`/api/admin/brochures/${newBrochureId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId,
              title: '수정된 제목',
            },
          ]),
        )
        .expect(200);

      // Then - 수정된 번역의 isSynced가 false인지 확인
      expect(updateResponse.body[0].isSynced).toBe(false);

      // Then - 상세 조회로도 확인
      const detailResponse = await testSuite
        .request()
        .get(`/api/admin/brochures/${newBrochureId}`)
        .expect(200);

      const koTranslation = detailResponse.body.translations.find(
        (t: any) => t.language.code === 'ko',
      );
      expect(koTranslation.isSynced).toBe(false);
      expect(koTranslation.title).toBe('수정된 제목');

      // 정리
      await testSuite
        .request()
        .delete(`/api/admin/brochures/${newBrochureId}`)
        .expect(200);
    });
  });
});

describe('브로슈어 일괄 순서 변경 (E2E)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;
  let categoryId: string;
  let brochureIds: string[] = [];

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
    brochureIds = [];

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

    // 여러 브로슈어 생성
    for (let i = 1; i <= 3; i++) {
      const response = await testSuite
        .request()
        .post('/api/admin/brochures')
        .send({
          translations: [
            {
              languageId,
              title: `브로슈어 ${i}`,
            },
          ],
          categoryId,
        });
      brochureIds.push(response.body.id);
    }
  });

  describe('PUT /api/admin/brochures/batch-order - 브로슈어 순서 일괄 변경', () => {
    it('브로슈어 순서를 일괄 변경할 수 있어야 한다', async () => {
      // Given
      const updateDto = {
        brochures: [
          { id: brochureIds[0], order: 2 },
          { id: brochureIds[1], order: 0 },
          { id: brochureIds[2], order: 1 },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .put('/api/admin/brochures/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        updatedCount: 3,
      });

      // 변경된 순서 확인
      const listResponse = await testSuite
        .request()
        .get('/api/admin/brochures?orderBy=order')
        .expect(200);

      const items = listResponse.body.items;
      expect(items[0].id).toBe(brochureIds[1]); // order: 0
      expect(items[1].id).toBe(brochureIds[2]); // order: 1
      expect(items[2].id).toBe(brochureIds[0]); // order: 2
    });

    it('일부 브로슈어만 순서를 변경할 수 있어야 한다', async () => {
      // Given - 2개만 순서 변경
      const updateDto = {
        brochures: [
          { id: brochureIds[0], order: 10 },
          { id: brochureIds[1], order: 5 },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .put('/api/admin/brochures/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        updatedCount: 2,
      });
    });

    it('빈 배열로 요청하면 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/brochures/batch-order')
        .send({ brochures: [] })
        .expect(400);
    });

    it('존재하지 않는 브로슈어 ID가 포함되면 404 에러가 발생해야 한다', async () => {
      // Given
      const updateDto = {
        brochures: [
          { id: brochureIds[0], order: 0 },
          { id: '00000000-0000-0000-0000-000000000001', order: 1 },
        ],
      };

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/brochures/batch-order')
        .send(updateDto)
        .expect(404);
    });

    it('brochures 필드가 누락되면 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/brochures/batch-order')
        .send({})
        .expect(400);
    });
  });
});

describe('브로슈어 필터링 (E2E)', () => {
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

  describe('GET /api/admin/brochures - 필터링', () => {
    it('공개된 브로슈어만 조회할 수 있어야 한다', async () => {
      // Given - 공개/비공개 브로슈어 생성
      const publicResponse = await testSuite
        .request()
        .post('/api/admin/brochures')
        .send({
          translations: [{ languageId, title: '공개 브로슈어' }],
          categoryId,
        });

      const publicId = publicResponse.body.id;

      const privateResponse = await testSuite
        .request()
        .post('/api/admin/brochures')
        .send({
          translations: [{ languageId, title: '비공개 브로슈어' }],
          categoryId,
        });

      const privateId = privateResponse.body.id;

      // 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/brochures/${privateId}/public`)
        .send({ isPublic: false });

      // When - 공개된 것만 조회
      const response = await testSuite
        .request()
        .get('/api/admin/brochures?isPublic=true')
        .expect(200);

      // Then
      const publicBrochures = response.body.items.filter(
        (b: any) => b.isPublic === true,
      );
      const privateBrochures = response.body.items.filter(
        (b: any) => b.isPublic === false,
      );

      expect(publicBrochures.length).toBeGreaterThan(0);
      expect(privateBrochures.length).toBe(0);
    });

    it('비공개 브로슈어만 조회할 수 있어야 한다', async () => {
      // Given
      const response = await testSuite
        .request()
        .post('/api/admin/brochures')
        .send({
          translations: [{ languageId, title: '비공개 브로슈어' }],
          categoryId,
        });

      const brochureId = response.body.id;

      // 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/brochures/${brochureId}/public`)
        .send({ isPublic: false });

      // When - 비공개만 조회
      const listResponse = await testSuite
        .request()
        .get('/api/admin/brochures?isPublic=false')
        .expect(200);

      // Then
      expect(listResponse.body.items.length).toBeGreaterThan(0);
      expect(listResponse.body.items.every((b: any) => b.isPublic === false)).toBe(
        true,
      );
    });

    it('페이지네이션을 적용할 수 있어야 한다', async () => {
      // Given - 15개 브로슈어 생성
      for (let i = 1; i <= 15; i++) {
        await testSuite.request().post('/api/admin/brochures').send({
          translations: [{ languageId, title: `브로슈어 ${i}` }],
          categoryId,
        });
      }

      // When - 1페이지 (10개)
      const page1Response = await testSuite
        .request()
        .get('/api/admin/brochures?page=1&limit=10')
        .expect(200);

      // When - 2페이지 (5개)
      const page2Response = await testSuite
        .request()
        .get('/api/admin/brochures?page=2&limit=10')
        .expect(200);

      // Then
      expect(page1Response.body.items.length).toBe(10);
      expect(page1Response.body.page).toBe(1);
      expect(page1Response.body.limit).toBe(10);
      expect(page1Response.body.total).toBeGreaterThanOrEqual(15);

      expect(page2Response.body.items.length).toBeGreaterThan(0);
      expect(page2Response.body.page).toBe(2);
    });

    it('생성일 기준으로 정렬할 수 있어야 한다', async () => {
      // Given - 여러 브로슈어 생성
      for (let i = 1; i <= 3; i++) {
        await testSuite.request().post('/api/admin/brochures').send({
          translations: [{ languageId, title: `브로슈어 ${i}` }],
          categoryId,
        });
      }

      // When - 생성일 기준 정렬
      const response = await testSuite
        .request()
        .get('/api/admin/brochures?orderBy=createdAt')
        .expect(200);

      // Then - 최신순으로 정렬되어야 함
      expect(response.body.items.length).toBeGreaterThan(0);
      if (response.body.items.length >= 2) {
        const firstDate = new Date(response.body.items[0].createdAt);
        const secondDate = new Date(response.body.items[1].createdAt);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });
});
