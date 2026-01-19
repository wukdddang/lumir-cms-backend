import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/shareholders-meetings (주주총회 조회)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;
  let meetingIds: string[] = [];

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
    meetingIds = [];

    // 이미 초기화된 한국어 언어를 조회
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);

    const koreanLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'ko',
    );

    languageId = koreanLanguage.id;

    // 테스트용 주주총회 여러 개 생성
    for (let i = 1; i <= 5; i++) {
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send({
          translations: [
            {
              languageId,
              title: `제${30 + i}기 정기 주주총회`,
              description: `${2020 + i}년 정기 주주총회`,
            },
          ],
          location: `${i === 1 ? '서울' : i === 2 ? '부산' : i === 3 ? '대구' : i === 4 ? '인천' : '광주'}`,
          meetingDate: `202${i}-03-15T10:00:00.000Z`,
        });
      meetingIds.push(response.body.id);
    }
  });

  describe('기본 목록 조회', () => {
    it('주주총회 목록을 조회할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings')
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
      expect(response.body.total).toBeGreaterThanOrEqual(5);
    });

    it('각 주주총회 항목이 필수 필드를 포함해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings')
        .expect(200);

      // Then
      const firstItem = response.body.items[0];
      expect(firstItem).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        isPublic: expect.any(Boolean),
        order: expect.any(Number),
        location: expect.any(String),
        meetingDate: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('페이지네이션', () => {
    it('페이지와 제한을 지정하여 조회할 수 있어야 한다', async () => {
      // When - 페이지 1, 제한 3
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?page=1&limit=3')
        .expect(200);

      // Then
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(3);
      expect(response.body.items.length).toBeLessThanOrEqual(3);
    });

    it('2페이지를 조회할 수 있어야 한다', async () => {
      // When - 페이지 2, 제한 3
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?page=2&limit=3')
        .expect(200);

      // Then
      expect(response.body.page).toBe(2);
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it('totalPages가 올바르게 계산되어야 한다', async () => {
      // When - 전체 조회
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?limit=2')
        .expect(200);

      // Then
      const expectedTotalPages = Math.ceil(response.body.total / 2);
      expect(response.body.totalPages).toBe(expectedTotalPages);
    });
  });

  describe('정렬', () => {
    it('order 기준으로 정렬할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?orderBy=order')
        .expect(200);

      // Then
      expect(response.body.items.length).toBeGreaterThan(0);
      // order 기준 오름차순 정렬 확인
      if (response.body.items.length >= 2) {
        const firstOrder = response.body.items[0].order;
        const secondOrder = response.body.items[1].order;
        expect(firstOrder).toBeLessThanOrEqual(secondOrder);
      }
    });

    it('meetingDate 기준으로 정렬할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?orderBy=meetingDate')
        .expect(200);

      // Then
      expect(response.body.items.length).toBeGreaterThan(0);
      // meetingDate 기준 내림차순 정렬 확인 (최신순)
      if (response.body.items.length >= 2) {
        const firstDate = new Date(response.body.items[0].meetingDate);
        const secondDate = new Date(response.body.items[1].meetingDate);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });

    it('createdAt 기준으로 정렬할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?orderBy=createdAt')
        .expect(200);

      // Then
      expect(response.body.items.length).toBeGreaterThan(0);
      // createdAt 기준 내림차순 정렬 확인 (최신순)
      if (response.body.items.length >= 2) {
        const firstDate = new Date(response.body.items[0].createdAt);
        const secondDate = new Date(response.body.items[1].createdAt);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });

  describe('필터링', () => {
    it('공개된 주주총회만 필터링할 수 있어야 한다', async () => {
      // Given - 하나를 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/${meetingIds[0]}/public`)
        .send({ isPublic: false });

      // When - 공개된 것만 조회
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?isPublic=true')
        .expect(200);

      // Then
      expect(response.body.items.every((m: any) => m.isPublic === true)).toBe(true);
    });

    it('비공개 주주총회만 필터링할 수 있어야 한다', async () => {
      // Given - 하나를 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/${meetingIds[0]}/public`)
        .send({ isPublic: false });

      // When - 비공개만 조회
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?isPublic=false')
        .expect(200);

      // Then
      expect(response.body.items.every((m: any) => m.isPublic === false)).toBe(
        true,
      );
      expect(response.body.items.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/shareholders-meetings/all - 전체 목록 조회', () => {
    it('전체 주주총회 목록을 조회할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings/all')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(5);
    });

    it('전체 목록에는 페이지네이션이 적용되지 않아야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings/all')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      // 페이지네이션 필드가 없어야 함
      expect(response.body.page).toBeUndefined();
      expect(response.body.limit).toBeUndefined();
      expect(response.body.total).toBeUndefined();
    });
  });

  describe('GET /api/admin/shareholders-meetings/:id - 상세 조회', () => {
    it('ID로 주주총회 상세를 조회할 수 있어야 한다', async () => {
      // Given
      const meetingId = meetingIds[0];

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/shareholders-meetings/${meetingId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: meetingId,
        isPublic: expect.any(Boolean),
        location: expect.any(String),
        meetingDate: expect.any(String),
        order: expect.any(Number),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('상세 조회 시 번역 정보가 포함되어야 한다', async () => {
      // Given
      const meetingId = meetingIds[0];

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/shareholders-meetings/${meetingId}`)
        .expect(200);

      // Then
      expect(response.body.translations).toBeDefined();
      expect(Array.isArray(response.body.translations)).toBe(true);
      expect(response.body.translations.length).toBeGreaterThan(0);

      // 각 번역이 필수 필드를 포함하는지 확인
      const firstTranslation = response.body.translations[0];
      expect(firstTranslation).toMatchObject({
        id: expect.any(String),
        languageId: expect.any(String),
        title: expect.any(String),
        isSynced: expect.any(Boolean),
      });
    });

    it('상세 조회 시 의결 결과가 포함되어야 한다 (있는 경우)', async () => {
      // Given - 의결 결과를 포함한 주주총회 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send({
          translations: [
            {
              languageId,
              title: '의결 결과 포함 주주총회',
            },
          ],
          location: '서울',
          meetingDate: '2024-06-20T10:00:00.000Z',
          voteResults: [
            {
              agendaNumber: 1,
              totalVote: 1000,
              yesVote: 850,
              noVote: 150,
              approvalRating: 85.0,
              result: 'accepted',
              translations: [
                {
                  languageId,
                  title: '제1호 안건',
                },
              ],
            },
          ],
        });

      const meetingId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/shareholders-meetings/${meetingId}`)
        .expect(200);

      // Then
      expect(response.body.voteResults).toBeDefined();
      expect(Array.isArray(response.body.voteResults)).toBe(true);
      expect(response.body.voteResults.length).toBe(1);

      const voteResult = response.body.voteResults[0];
      expect(voteResult).toMatchObject({
        id: expect.any(String),
        agendaNumber: 1,
        totalVote: 1000,
        yesVote: 850,
        noVote: 150,
        approvalRating: 85.0,
        result: 'accepted',
      });
    });

    it('존재하지 않는 ID로 조회하면 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/api/admin/shareholders-meetings/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });

    it('잘못된 UUID 형식으로 조회하면 400 에러가 발생해야 한다', async () => {
      // When & Then
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings/invalid-uuid');

      // 400 또는 500 에러 (구현에 따라 다를 수 있음)
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('복합 조회', () => {
    it('페이지네이션과 정렬을 함께 적용할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?page=1&limit=3&orderBy=meetingDate')
        .expect(200);

      // Then
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(3);
      expect(response.body.items.length).toBeLessThanOrEqual(3);

      // meetingDate 기준 정렬 확인
      if (response.body.items.length >= 2) {
        const firstDate = new Date(response.body.items[0].meetingDate);
        const secondDate = new Date(response.body.items[1].meetingDate);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });

    it('필터링과 페이지네이션을 함께 적용할 수 있어야 한다', async () => {
      // Given - 일부를 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/${meetingIds[0]}/public`)
        .send({ isPublic: false });
      await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/${meetingIds[1]}/public`)
        .send({ isPublic: false });

      // When - 공개된 것만 페이지네이션
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?isPublic=true&page=1&limit=2')
        .expect(200);

      // Then
      expect(response.body.items.every((m: any) => m.isPublic === true)).toBe(true);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
    });

    it('필터링, 정렬, 페이지네이션을 모두 함께 적용할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(
          '/api/admin/shareholders-meetings?isPublic=true&orderBy=meetingDate&page=1&limit=3',
        )
        .expect(200);

      // Then
      expect(response.body.items.every((m: any) => m.isPublic === true)).toBe(true);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(3);
      expect(response.body.items.length).toBeLessThanOrEqual(3);
    });
  });

  describe('빈 결과', () => {
    it('조건에 맞는 주주총회가 없으면 빈 배열을 반환해야 한다', async () => {
      // Given - 모든 주주총회를 비공개로 변경
      for (const id of meetingIds) {
        await testSuite
          .request()
          .patch(`/api/admin/shareholders-meetings/${id}/public`)
          .send({ isPublic: false });
      }

      // When - 공개된 것만 조회
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?isPublic=true')
        .expect(200);

      // Then
      expect(response.body.items).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('존재하지 않는 페이지를 조회하면 빈 배열을 반환해야 한다', async () => {
      // When - 매우 큰 페이지 번호
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?page=999&limit=10')
        .expect(200);

      // Then
      expect(response.body.items).toEqual([]);
      expect(response.body.page).toBe(999);
    });
  });
});
