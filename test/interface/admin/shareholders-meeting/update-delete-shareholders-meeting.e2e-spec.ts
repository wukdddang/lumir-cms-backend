import { BaseE2ETest } from '../../../base-e2e.spec';

describe('주주총회 수정/삭제 (E2E)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;
  let categoryId: string;
  let meetingId: string;

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

    // 주주총회 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/shareholders-meetings/categories')
      .send({
        name: '정기 주주총회',
        description: '연례 정기 주주총회',
        isActive: true,
        order: 0,
      })
      .expect(201);

    categoryId = categoryResponse.body.id;

    // 테스트용 주주총회 생성
    const meetingResponse = await testSuite
      .request()
      .post('/api/admin/shareholders-meetings')
      .send({
        categoryId,
        translations: [
          {
            languageId,
            title: '테스트 주주총회',
            description: '테스트 설명',
          },
        ],
        location: '서울 강남구',
        meetingDate: '2024-03-15T10:00:00.000Z',
      });
    meetingId = meetingResponse.body.id;
  });

  describe('PUT /api/admin/shareholders-meetings/:id - 주주총회 수정', () => {
    it('주주총회를 수정할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/shareholders-meetings/${meetingId}`)
        .field('categoryId', categoryId)
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
        .field('location', '부산 해운대')
        .field('meetingDate', '2024-06-20T14:00:00.000Z')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: meetingId,
        location: '부산 해운대',
      });

      // 번역 확인
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation).toMatchObject({
        title: '수정된 제목',
        description: '수정된 설명',
        isSynced: false, // 수정 시 isSynced가 false로 변경됨
      });
    });

    it('제목만 수정할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/shareholders-meetings/${meetingId}`)
        .field('categoryId', categoryId)
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
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation.title).toBe('제목만 수정');
    });

    it('의결 결과를 추가할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/shareholders-meetings/${meetingId}`)
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId,
              title: '주주총회',
            },
          ]),
        )
        .field(
          'voteResults',
          JSON.stringify([
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
                  title: '제1호 안건: 재무제표 승인',
                },
              ],
            },
          ]),
        )
        .expect(200);

      // Then
      expect(response.body.voteResults).toHaveLength(1);
      expect(response.body.voteResults[0]).toMatchObject({
        agendaNumber: 1,
        totalVote: 1000,
        yesVote: 850,
        result: 'accepted',
      });
    });

    it('존재하지 않는 주주총회를 수정하면 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/shareholders-meetings/00000000-0000-0000-0000-000000000001')
        .field('categoryId', categoryId)
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
        .put(`/api/admin/shareholders-meetings/${meetingId}`)
        .field('categoryId', categoryId)
        .expect(400);
    });
  });

  describe('PATCH /api/admin/shareholders-meetings/:id/public - 주주총회 공개 상태 수정', () => {
    it('주주총회를 비공개로 변경할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/${meetingId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(false);
    });

    it('주주총회를 공개로 변경할 수 있어야 한다', async () => {
      // Given - 먼저 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/${meetingId}/public`)
        .send({ isPublic: false });

      // When - 다시 공개로 변경
      const response = await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/${meetingId}/public`)
        .send({ isPublic: true })
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(true);
    });

    it('존재하지 않는 주주총회의 공개 상태를 변경하면 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .patch(
          '/api/admin/shareholders-meetings/00000000-0000-0000-0000-000000000001/public',
        )
        .send({ isPublic: false })
        .expect(404);
    });

    it('isPublic이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/${meetingId}/public`)
        .send({})
        .expect(400);
    });
  });

  describe('DELETE /api/admin/shareholders-meetings/:id - 주주총회 삭제', () => {
    it('주주총회를 삭제할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .delete(`/api/admin/shareholders-meetings/${meetingId}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
    });

    it('삭제된 주주총회는 조회되지 않아야 한다', async () => {
      // Given - 주주총회 삭제
      await testSuite
        .request()
        .delete(`/api/admin/shareholders-meetings/${meetingId}`)
        .expect(200);

      // When & Then - 삭제된 주주총회 조회 시도
      await testSuite
        .request()
        .get(`/api/admin/shareholders-meetings/${meetingId}`)
        .expect(404);
    });

    it('삭제된 주주총회는 목록에 나타나지 않아야 한다', async () => {
      // Given - 주주총회 삭제
      await testSuite
        .request()
        .delete(`/api/admin/shareholders-meetings/${meetingId}`)
        .expect(200);

      // When - 목록 조회
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings')
        .expect(200);

      // Then
      const found = response.body.items.find((m: any) => m.id === meetingId);
      expect(found).toBeUndefined();
    });

    it('존재하지 않는 주주총회를 삭제하면 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .delete('/api/admin/shareholders-meetings/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });

    it('이미 삭제된 주주총회를 다시 삭제하면 404 에러가 발생해야 한다', async () => {
      // Given - 주주총회 삭제
      await testSuite
        .request()
        .delete(`/api/admin/shareholders-meetings/${meetingId}`)
        .expect(200);

      // When & Then - 다시 삭제 시도
      await testSuite
        .request()
        .delete(`/api/admin/shareholders-meetings/${meetingId}`)
        .expect(404);
    });
  });

  describe('주주총회 수정 후 삭제', () => {
    it('수정한 주주총회를 삭제할 수 있어야 한다', async () => {
      // Given - 주주총회 수정
      await testSuite
        .request()
        .put(`/api/admin/shareholders-meetings/${meetingId}`)
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId,
              title: '수정된 후 삭제될 주주총회',
            },
          ]),
        )
        .expect(200);

      // When - 삭제
      const response = await testSuite
        .request()
        .delete(`/api/admin/shareholders-meetings/${meetingId}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
    });
  });
});

describe('주주총회 일괄 순서 변경 (E2E)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;
  let categoryId: string;
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

    // 주주총회 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/shareholders-meetings/categories')
      .send({
        name: '정기 주주총회',
        description: '연례 정기 주주총회',
        isActive: true,
        order: 0,
      })
      .expect(201);

    categoryId = categoryResponse.body.id;

    // 여러 주주총회 생성
    for (let i = 1; i <= 3; i++) {
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send({
          categoryId,
          translations: [
            {
              languageId,
              title: `주주총회 ${i}`,
            },
          ],
          location: '서울 강남구',
          meetingDate: `2024-0${i + 2}-15T10:00:00.000Z`,
        });
      meetingIds.push(response.body.id);
    }
  });

  describe('PUT /api/admin/shareholders-meetings/batch-order - 주주총회 순서 일괄 변경', () => {
    it('주주총회 순서를 일괄 변경할 수 있어야 한다', async () => {
      // Given
      const updateDto = {
        shareholdersMeetings: [
          { id: meetingIds[0], order: 2 },
          { id: meetingIds[1], order: 0 },
          { id: meetingIds[2], order: 1 },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .put('/api/admin/shareholders-meetings/batch-order')
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
        .get('/api/admin/shareholders-meetings?orderBy=order')
        .expect(200);

      const items = listResponse.body.items;
      expect(items[0].id).toBe(meetingIds[1]); // order: 0
      expect(items[1].id).toBe(meetingIds[2]); // order: 1
      expect(items[2].id).toBe(meetingIds[0]); // order: 2
    });

    it('일부 주주총회만 순서를 변경할 수 있어야 한다', async () => {
      // Given - 2개만 순서 변경
      const updateDto = {
        shareholdersMeetings: [
          { id: meetingIds[0], order: 10 },
          { id: meetingIds[1], order: 5 },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .put('/api/admin/shareholders-meetings/batch-order')
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
        .put('/api/admin/shareholders-meetings/batch-order')
        .send({ shareholdersMeetings: [] })
        .expect(400);
    });

    it('존재하지 않는 주주총회 ID가 포함되면 404 에러가 발생해야 한다', async () => {
      // Given
      const updateDto = {
        shareholdersMeetings: [
          { id: meetingIds[0], order: 0 },
          { id: '00000000-0000-0000-0000-000000000001', order: 1 },
        ],
      };

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/shareholders-meetings/batch-order')
        .send(updateDto)
        .expect(404);
    });

    it('shareholdersMeetings 필드가 누락되면 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/shareholders-meetings/batch-order')
        .send({})
        .expect(400);
    });
  });
});

describe('주주총회 필터링 (E2E)', () => {
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

    // 주주총회 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/shareholders-meetings/categories')
      .send({
        name: '정기 주주총회',
        description: '연례 정기 주주총회',
        isActive: true,
        order: 0,
      })
      .expect(201);

    categoryId = categoryResponse.body.id;
  });

  describe('GET /api/admin/shareholders-meetings - 필터링', () => {
    it('공개된 주주총회만 조회할 수 있어야 한다', async () => {
      // Given - 공개/비공개 주주총회 생성
      const publicResponse = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send({
          categoryId,
          translations: [{ languageId, title: '공개 주주총회' }],
          location: '서울',
          meetingDate: '2024-03-15T10:00:00.000Z',
        });

      const publicId = publicResponse.body.id;

      const privateResponse = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send({
          categoryId,
          translations: [{ languageId, title: '비공개 주주총회' }],
          location: '서울',
          meetingDate: '2024-06-20T10:00:00.000Z',
        });

      const privateId = privateResponse.body.id;

      // 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/${privateId}/public`)
        .send({ isPublic: false });

      // When - 공개된 것만 조회
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?isPublic=true')
        .expect(200);

      // Then
      const publicMeetings = response.body.items.filter(
        (m: any) => m.isPublic === true,
      );
      const privateMeetings = response.body.items.filter(
        (m: any) => m.isPublic === false,
      );

      expect(publicMeetings.length).toBeGreaterThan(0);
      expect(privateMeetings.length).toBe(0);
    });

    it('비공개 주주총회만 조회할 수 있어야 한다', async () => {
      // Given
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send({
          categoryId,
          translations: [{ languageId, title: '비공개 주주총회' }],
          location: '서울',
          meetingDate: '2024-03-15T10:00:00.000Z',
        });

      const meetingId = response.body.id;

      // 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/shareholders-meetings/${meetingId}/public`)
        .send({ isPublic: false });

      // When - 비공개만 조회
      const listResponse = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?isPublic=false')
        .expect(200);

      // Then
      expect(listResponse.body.items.length).toBeGreaterThan(0);
      expect(listResponse.body.items.every((m: any) => m.isPublic === false)).toBe(
        true,
      );
    });

    it('페이지네이션을 적용할 수 있어야 한다', async () => {
      // Given - 15개 주주총회 생성
      for (let i = 1; i <= 15; i++) {
        await testSuite.request().post('/api/admin/shareholders-meetings').send({
          categoryId,
          translations: [{ languageId, title: `주주총회 ${i}` }],
          location: '서울',
          meetingDate: `2024-03-${String(i).padStart(2, '0')}T10:00:00.000Z`,
        });
      }

      // When - 1페이지 (10개)
      const page1Response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?page=1&limit=10')
        .expect(200);

      // When - 2페이지 (5개)
      const page2Response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?page=2&limit=10')
        .expect(200);

      // Then
      expect(page1Response.body.items.length).toBe(10);
      expect(page1Response.body.page).toBe(1);
      expect(page1Response.body.limit).toBe(10);
      expect(page1Response.body.total).toBeGreaterThanOrEqual(15);

      expect(page2Response.body.items.length).toBeGreaterThan(0);
      expect(page2Response.body.page).toBe(2);
    });

    it('주주총회 일시 기준으로 정렬할 수 있어야 한다', async () => {
      // Given - 여러 주주총회 생성
      for (let i = 1; i <= 3; i++) {
        await testSuite.request().post('/api/admin/shareholders-meetings').send({
          categoryId,
          translations: [{ languageId, title: `주주총회 ${i}` }],
          location: '서울',
          meetingDate: `2024-0${i + 2}-15T10:00:00.000Z`,
        });
      }

      // When - 주주총회 일시 기준 정렬
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?orderBy=meetingDate')
        .expect(200);

      // Then - 최신순으로 정렬되어야 함
      expect(response.body.items.length).toBeGreaterThan(0);
      if (response.body.items.length >= 2) {
        const firstDate = new Date(response.body.items[0].meetingDate);
        const secondDate = new Date(response.body.items[1].meetingDate);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });

    it('생성일 기준으로 정렬할 수 있어야 한다', async () => {
      // Given - 여러 주주총회 생성
      for (let i = 1; i <= 3; i++) {
        await testSuite.request().post('/api/admin/shareholders-meetings').send({
          categoryId,
          translations: [{ languageId, title: `주주총회 ${i}` }],
          location: '서울',
          meetingDate: '2024-03-15T10:00:00.000Z',
        });
      }

      // When - 생성일 기준 정렬
      const response = await testSuite
        .request()
        .get('/api/admin/shareholders-meetings?orderBy=createdAt')
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
