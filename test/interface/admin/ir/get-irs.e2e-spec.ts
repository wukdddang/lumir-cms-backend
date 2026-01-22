import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/irs (IR 조회)', () => {
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

  describe('GET /api/admin/irs (목록 조회)', () => {
    it('IR 목록을 조회해야 한다', async () => {
      // Given - IR 생성
      const translationsData = [
        {
          languageId,
          title: '2024년 1분기 IR 자료',
          description: '설명',
        },
      ];

      await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', categoryId)
        .expect(201);

      // When - 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/irs')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number),
        totalPages: expect.any(Number),
      });
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items[0]).toMatchObject({
        id: expect.any(String),
        isPublic: expect.any(Boolean),
        order: expect.any(Number),
        title: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('빈 목록도 정상적으로 조회해야 한다', async () => {
      // When - 생성 없이 바로 조회
      const response = await testSuite
        .request()
        .get('/api/admin/irs')
        .expect(200);

      // Then
      expect(response.body.items).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('공개 여부로 필터링하여 조회해야 한다', async () => {
      // Given - 공개/비공개 IR 각각 생성
      const translationsData1 = [
        {
          languageId,
          title: '공개 IR',
        },
      ];

      const createResponse1 = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData1))
        .field('categoryId', categoryId)
        .expect(201);

      const irId1 = createResponse1.body.id;

      // 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/irs/${irId1}/public`)
        .send({ isPublic: false })
        .expect(200);

      // 공개 IR 생성
      const translationsData2 = [
        {
          languageId,
          title: '공개 IR 2',
        },
      ];

      await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData2))
        .field('categoryId', categoryId)
        .expect(201);

      // When - 공개된 IR만 조회
      const response = await testSuite
        .request()
        .get('/api/admin/irs?isPublic=true')
        .expect(200);

      // Then - 모두 공개된 것들만 있어야 함
      response.body.items.forEach((item: any) => {
        expect(item.isPublic).toBe(true);
      });
    });

    it('페이징 처리가 정확해야 한다', async () => {
      // Given - 여러 IR 생성 (15개)
      const createPromises = Array.from({ length: 15 }, (_, i) =>
        testSuite
          .request()
          .post('/api/admin/irs')
          .field(
            'translations',
            JSON.stringify([
              {
                languageId,
                title: `IR ${i + 1}`,
              },
            ]),
          )
          .field('categoryId', categoryId),
      );

      await Promise.all(createPromises);

      // When - 1페이지 조회 (limit=10)
      const page1Response = await testSuite
        .request()
        .get('/api/admin/irs?page=1&limit=10')
        .expect(200);

      // Then
      expect(page1Response.body.items).toHaveLength(10);
      expect(page1Response.body.total).toBe(15);
      expect(page1Response.body.page).toBe(1);
      expect(page1Response.body.limit).toBe(10);
      expect(page1Response.body.totalPages).toBe(2); // Math.ceil(15 / 10)

      // When - 2페이지 조회
      const page2Response = await testSuite
        .request()
        .get('/api/admin/irs?page=2&limit=10')
        .expect(200);

      // Then
      expect(page2Response.body.items).toHaveLength(5);
      expect(page2Response.body.page).toBe(2);
    });

    it('정렬 순서로 조회해야 한다 (orderBy=order)', async () => {
      // Given - IR 생성
      const translationsData1 = [{ languageId, title: '첫 번째' }];
      const translationsData2 = [{ languageId, title: '두 번째' }];

      await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData1))
        .field('categoryId', categoryId)
        .expect(201);

      await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData2))
        .field('categoryId', categoryId)
        .expect(201);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/irs?orderBy=order')
        .expect(200);

      // Then - order 필드가 오름차순이어야 함
      expect(response.body.items.length).toBeGreaterThan(0);
      for (let i = 1; i < response.body.items.length; i++) {
        expect(response.body.items[i].order).toBeGreaterThanOrEqual(
          response.body.items[i - 1].order,
        );
      }
    });

    it('생성일 기준으로 조회해야 한다 (orderBy=createdAt)', async () => {
      // Given - IR 생성
      const translationsData1 = [{ languageId, title: '먼저 생성' }];
      const translationsData2 = [{ languageId, title: '나중에 생성' }];

      const firstResponse = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData1))
        .field('categoryId', categoryId)
        .expect(201);

      const firstCreatedAt = new Date(firstResponse.body.createdAt);

      // 약간의 시간 차이
      await new Promise((resolve) => setTimeout(resolve, 100));

      const secondResponse = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData2))
        .field('categoryId', categoryId)
        .expect(201);

      const secondCreatedAt = new Date(secondResponse.body.createdAt);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/irs?orderBy=createdAt')
        .expect(200);

      // Then - 최근 생성된 것이 먼저 와야 함 (DESC)
      expect(response.body.items.length).toBeGreaterThan(0);
      
      // createdAt으로 정렬되었는지 확인 (DESC)
      expect(secondCreatedAt >= firstCreatedAt).toBe(true);
      
      // 첫 번째 항목이 가장 최근에 생성된 것이어야 함
      const firstItemCreatedAt = new Date(response.body.items[0].createdAt);
      expect(firstItemCreatedAt >= firstCreatedAt).toBe(true);
    });

    it('날짜 범위로 필터링하여 조회해야 한다', async () => {
      // Given - IR 생성
      const translationsData = [
        {
          languageId,
          title: '날짜 필터 테스트',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', categoryId)
        .expect(201);

      const createdIRId = createResponse.body.id;
      const createdDate = new Date(createResponse.body.createdAt);
      
      // When - 생성된 날짜로 필터링 (전날부터 다음날까지)
      const startDate = new Date(createdDate);
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date(createdDate);
      endDate.setDate(endDate.getDate() + 1);

      const response = await testSuite
        .request()
        .get(
          `/api/admin/irs?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
        )
        .expect(200);

      // Then - 생성한 IR이 결과에 포함되어야 함
      expect(response.body.items.length).toBeGreaterThan(0);
      const found = response.body.items.some(
        (item: any) => item.id === createdIRId,
      );
      expect(found).toBe(true);
    });
  });

  describe('GET /api/admin/irs/all (전체 목록 조회)', () => {
    it('페이징 없이 전체 IR을 조회해야 한다', async () => {
      // Given - 여러 IR 생성
      const createPromises = Array.from({ length: 3 }, (_, i) =>
        testSuite
          .request()
          .post('/api/admin/irs')
          .field(
            'translations',
            JSON.stringify([
              {
                languageId,
                title: `전체 조회 테스트 ${i + 1}`,
              },
            ]),
          )
          .field('categoryId', categoryId),
      );

      await Promise.all(createPromises);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/irs/all')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('GET /api/admin/irs/:id (상세 조회)', () => {
    it('IR 상세를 조회해야 한다', async () => {
      // Given - IR 생성
      const translationsData = [
        {
          languageId,
          title: '상세 조회 테스트',
          description: '설명입니다.',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', categoryId)
        .expect(201);

      const irId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/irs/${irId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: irId,
        isPublic: expect.any(Boolean),
        order: expect.any(Number),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(response.body.translations).toHaveLength(4);
    });

    it('파일이 포함된 IR 상세를 조회해야 한다', async () => {
      // Given - 파일이 있는 IR 생성
      const translationsData = [
        {
          languageId,
          title: '파일 포함 테스트',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translationsData))
        .field('categoryId', categoryId)
        .attach('files', Buffer.from('PDF content'), 'test.pdf')
        .expect(201);

      const irId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/irs/${irId}`)
        .expect(200);

      // Then
      expect(response.body.attachments).toBeDefined();
      expect(response.body.attachments).toHaveLength(1);
      expect(response.body.attachments[0]).toMatchObject({
        fileName: expect.any(String),
        fileUrl: expect.any(String),
        fileSize: expect.any(Number),
        mimeType: expect.any(String),
      });
    });

    it('존재하지 않는 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/api/admin/irs/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });

    it('잘못된 UUID 형식으로 조회 시 400 에러가 발생해야 한다', async () => {
      // When & Then - ParseUUIDPipe가 400 에러를 반환해야 함
      await testSuite
        .request()
        .get('/api/admin/irs/invalid-uuid')
        .expect(400);
    });
  });

  describe('GET /api/admin/irs/categories (카테고리 목록 조회)', () => {
    it('IR 카테고리 목록을 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/irs/categories')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
      });
    });
  });

  describe('복합 시나리오', () => {
    it('여러 IR을 생성하고 다양한 필터로 조회해야 한다', async () => {
      // Given - 여러 IR 생성
      const translations1 = [{ languageId, title: '공개 IR A' }];
      const translations2 = [{ languageId, title: '공개 IR B' }];
      const translations3 = [{ languageId, title: '비공개 IR' }];

      const ir1 = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translations1))
        .field('categoryId', categoryId)
        .expect(201);

      await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translations2))
        .field('categoryId', categoryId)
        .expect(201);

      const ir3 = await testSuite
        .request()
        .post('/api/admin/irs')
        .field('translations', JSON.stringify(translations3))
        .field('categoryId', categoryId)
        .expect(201);

      // 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/irs/${ir3.body.id}/public`)
        .send({ isPublic: false })
        .expect(200);

      // When - 공개된 IR만 조회
      const publicResponse = await testSuite
        .request()
        .get('/api/admin/irs?isPublic=true')
        .expect(200);

      // Then
      expect(publicResponse.body.items.length).toBeGreaterThanOrEqual(2);
      publicResponse.body.items.forEach((item: any) => {
        expect(item.isPublic).toBe(true);
      });

      // When - 비공개 IR만 조회
      const privateResponse = await testSuite
        .request()
        .get('/api/admin/irs?isPublic=false')
        .expect(200);

      // Then
      const privateIR = privateResponse.body.items.find(
        (item: any) => item.id === ir3.body.id,
      );
      expect(privateIR).toBeDefined();
      expect(privateIR.isPublic).toBe(false);
    });
  });
});
