import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PUT/PATCH/DELETE /api/admin/electronic-disclosures (전자공시 수정/삭제)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;
  let englishLanguageId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 이미 초기화된 언어들을 조회
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);

    const koreanLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'ko',
    );
    const englishLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'en',
    );

    languageId = koreanLanguage.id;
    englishLanguageId = englishLanguage.id;
  });

  describe('PUT /api/admin/electronic-disclosures/:id (전자공시 수정)', () => {
    it('전자공시의 번역을 수정해야 한다', async () => {
      // Given - 전자공시 생성
      const translationsData = [
        {
          languageId,
          title: '원래 제목',
          description: '원래 설명',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(201);

      const disclosureId = createResponse.body.id;

      // When - 번역 수정
      const updatedTranslations = [
        {
          languageId,
          title: '수정된 제목',
          description: '수정된 설명',
        },
      ];

      const updateResponse = await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field('translations', JSON.stringify(updatedTranslations))
        .expect(200);

      // Then
      const koTranslation = updateResponse.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation.title).toBe('수정된 제목');
      expect(koTranslation.description).toBe('수정된 설명');
    });

    it('파일과 함께 전자공시를 수정해야 한다 (기존 파일 교체)', async () => {
      // Given - 파일이 있는 전자공시 생성
      const translationsData = [
        {
          languageId,
          title: '파일 수정 테스트',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .attach('files', Buffer.from('Old PDF'), 'old.pdf')
        .expect(201);

      const disclosureId = createResponse.body.id;
      const oldAttachment = createResponse.body.attachments[0];

      // When - 새 파일로 교체
      const updatedTranslations = [
        {
          languageId,
          title: '파일 수정 테스트',
        },
      ];

      const updateResponse = await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field('translations', JSON.stringify(updatedTranslations))
        .attach('files', Buffer.from('New PDF'), 'new.pdf')
        .expect(200);

      // Then - 새 파일로 교체되었어야 함
      expect(updateResponse.body.attachments).toHaveLength(1);
      expect(updateResponse.body.attachments[0].fileName).not.toBe(
        oldAttachment.fileName,
      );
      expect(updateResponse.body.attachments[0].fileName).toContain('new');
    });

    it('파일 없이 수정하면 기존 파일이 삭제되어야 한다', async () => {
      // Given - 파일이 있는 전자공시 생성
      const translationsData = [
        {
          languageId,
          title: '파일 삭제 테스트',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .attach('files', Buffer.from('PDF'), 'test.pdf')
        .expect(201);

      const disclosureId = createResponse.body.id;
      expect(createResponse.body.attachments).toHaveLength(1);

      // When - 파일 없이 수정
      const updatedTranslations = [
        {
          languageId,
          title: '파일 삭제 테스트',
        },
      ];

      const updateResponse = await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field('translations', JSON.stringify(updatedTranslations))
        .expect(200);

      // Then - 파일이 삭제되었어야 함
      expect(
        updateResponse.body.attachments === null ||
          updateResponse.body.attachments.length === 0,
      ).toBe(true);
    });

    it('여러 파일로 수정해야 한다', async () => {
      // Given - 전자공시 생성
      const translationsData = [
        {
          languageId,
          title: '여러 파일 수정',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(201);

      const disclosureId = createResponse.body.id;

      // When - 여러 파일 추가
      const updatedTranslations = [
        {
          languageId,
          title: '여러 파일 수정',
        },
      ];

      const updateResponse = await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field('translations', JSON.stringify(updatedTranslations))
        .attach('files', Buffer.from('PDF 1'), 'file1.pdf')
        .attach('files', Buffer.from('PDF 2'), 'file2.pdf')
        .expect(200);

      // Then
      expect(updateResponse.body.attachments).toHaveLength(2);
    });

    it('존재하지 않는 ID로 수정 시 404 에러가 발생해야 한다', async () => {
      // Given
      const updatedTranslations = [
        {
          languageId,
          title: '수정 시도',
        },
      ];

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/electronic-disclosures/00000000-0000-0000-0000-000000000001')
        .field('translations', JSON.stringify(updatedTranslations))
        .expect(404);
    });

    it('translations 없이 수정 시 400 에러가 발생해야 한다', async () => {
      // Given - 전자공시 생성
      const translationsData = [
        {
          languageId,
          title: '테스트',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(201);

      const disclosureId = createResponse.body.id;

      // When & Then - translations 없이 수정 시도
      await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(400);
    });
  });

  describe('PATCH /api/admin/electronic-disclosures/:id/public (공개 상태 수정)', () => {
    it('전자공시를 비공개로 변경해야 한다', async () => {
      // Given - 공개 전자공시 생성
      const translationsData = [
        {
          languageId,
          title: '공개 테스트',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(201);

      const disclosureId = createResponse.body.id;
      expect(createResponse.body.isPublic).toBe(true);

      // When - 비공개로 변경
      const patchResponse = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then
      expect(patchResponse.body.isPublic).toBe(false);

      // 조회해서 확인
      const getResponse = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      expect(getResponse.body.isPublic).toBe(false);
    });

    it('전자공시를 공개로 변경해야 한다', async () => {
      // Given - 비공개 전자공시 생성 후 변경
      const translationsData = [
        {
          languageId,
          title: '비공개 테스트',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(201);

      const disclosureId = createResponse.body.id;

      await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // When - 공개로 변경
      const patchResponse = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureId}/public`)
        .send({ isPublic: true })
        .expect(200);

      // Then
      expect(patchResponse.body.isPublic).toBe(true);
    });

    it('존재하지 않는 ID로 공개 상태 수정 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .patch(
          '/api/admin/electronic-disclosures/00000000-0000-0000-0000-000000000001/public',
        )
        .send({ isPublic: false })
        .expect(404);
    });
  });

  describe('PUT /api/admin/electronic-disclosures/batch-order (순서 일괄 수정)', () => {
    it('여러 전자공시의 순서를 일괄 수정해야 한다', async () => {
      // Given - 여러 전자공시 생성
      const translations1 = [{ languageId, title: '첫 번째' }];
      const translations2 = [{ languageId, title: '두 번째' }];
      const translations3 = [{ languageId, title: '세 번째' }];

      const disclosure1 = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translations1))
        .expect(201);

      const disclosure2 = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translations2))
        .expect(201);

      const disclosure3 = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translations3))
        .expect(201);

      // When - 순서 변경 (역순으로)
      const batchOrderDto = {
        electronicDisclosures: [
          { id: disclosure3.body.id, order: 0 },
          { id: disclosure2.body.id, order: 1 },
          { id: disclosure1.body.id, order: 2 },
        ],
      };

      const updateResponse = await testSuite
        .request()
        .put('/api/admin/electronic-disclosures/batch-order')
        .send(batchOrderDto)
        .expect(200);

      // Then
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.updatedCount).toBe(3);

      // 순서가 변경되었는지 확인
      const getResponse1 = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosure1.body.id}`)
        .expect(200);
      expect(getResponse1.body.order).toBe(2);

      const getResponse3 = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosure3.body.id}`)
        .expect(200);
      expect(getResponse3.body.order).toBe(0);
    });

    it('빈 배열로 일괄 수정 시 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/electronic-disclosures/batch-order')
        .send({ electronicDisclosures: [] })
        .expect(400);
    });

    it('존재하지 않는 ID가 포함된 경우 404 에러가 발생해야 한다', async () => {
      // When & Then
      const batchOrderDto = {
        electronicDisclosures: [
          { id: '00000000-0000-0000-0000-000000000001', order: 0 },
        ],
      };

      await testSuite
        .request()
        .put('/api/admin/electronic-disclosures/batch-order')
        .send(batchOrderDto)
        .expect(404);
    });
  });

  describe('DELETE /api/admin/electronic-disclosures/:id (전자공시 삭제)', () => {
    it('전자공시를 삭제해야 한다 (Soft Delete)', async () => {
      // Given - 전자공시 생성
      const translationsData = [
        {
          languageId,
          title: '삭제 테스트',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(201);

      const disclosureId = createResponse.body.id;

      // When - 삭제
      const deleteResponse = await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      // Then
      expect(deleteResponse.body.success).toBe(true);

      // 삭제 후 조회 시 404 (Soft Delete)
      await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(404);
    });

    it('파일이 있는 전자공시를 삭제해야 한다', async () => {
      // Given - 파일이 있는 전자공시 생성
      const translationsData = [
        {
          languageId,
          title: '파일 포함 삭제 테스트',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .attach('files', Buffer.from('PDF'), 'test.pdf')
        .expect(201);

      const disclosureId = createResponse.body.id;
      expect(createResponse.body.attachments).toHaveLength(1);

      // When - 삭제
      const deleteResponse = await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      // Then
      expect(deleteResponse.body.success).toBe(true);

      // 삭제 후 조회 시 404
      await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(404);
    });

    it('존재하지 않는 ID로 삭제 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .delete('/api/admin/electronic-disclosures/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });

    it('이미 삭제된 전자공시를 다시 삭제 시 404 에러가 발생해야 한다', async () => {
      // Given - 전자공시 생성 및 삭제
      const translationsData = [
        {
          languageId,
          title: '중복 삭제 테스트',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(201);

      const disclosureId = createResponse.body.id;

      await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      // When & Then - 이미 삭제된 것을 다시 삭제 시도
      await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(404);
    });
  });

  describe('복합 시나리오', () => {
    it('전자공시를 생성, 수정, 공개 변경, 순서 변경, 삭제하는 전체 플로우를 테스트해야 한다', async () => {
      // 1. 생성
      const translationsData = [
        {
          languageId,
          title: '복합 시나리오 테스트',
          description: '원래 설명',
        },
      ];

      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify(translationsData))
        .expect(201);

      const disclosureId = createResponse.body.id;
      expect(createResponse.body.isPublic).toBe(true);

      // 2. 수정
      const updatedTranslations = [
        {
          languageId,
          title: '수정된 제목',
          description: '수정된 설명',
        },
      ];

      const updateResponse = await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field('translations', JSON.stringify(updatedTranslations))
        .expect(200);

      const koTranslation = updateResponse.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation.title).toBe('수정된 제목');

      // 3. 공개 상태 변경
      const patchResponse = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureId}/public`)
        .send({ isPublic: false })
        .expect(200);

      expect(patchResponse.body.isPublic).toBe(false);

      // 4. 다시 공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureId}/public`)
        .send({ isPublic: true })
        .expect(200);

      // 5. 순서 변경
      const batchOrderDto = {
        electronicDisclosures: [{ id: disclosureId, order: 99 }],
      };

      await testSuite
        .request()
        .put('/api/admin/electronic-disclosures/batch-order')
        .send(batchOrderDto)
        .expect(200);

      const getResponse = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      expect(getResponse.body.order).toBe(99);

      // 6. 삭제
      await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      // 7. 삭제 확인
      await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(404);
    });
  });
});
