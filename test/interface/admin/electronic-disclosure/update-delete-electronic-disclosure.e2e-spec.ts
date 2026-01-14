import { BaseE2ETest } from '../../../base-e2e.spec';

describe('UPDATE & DELETE /api/admin/electronic-disclosures (전자공시 수정 & 삭제)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;
  let enLanguageId: string;
  let disclosureId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트용 언어 생성
    const langResponse = await testSuite
      .request()
      .post('/api/admin/languages')
      .send({ code: 'ko', name: '한국어', isActive: true });
    languageId = langResponse.body.id;

    const enLangResponse = await testSuite
      .request()
      .post('/api/admin/languages')
      .send({ code: 'en', name: 'English', isActive: true });
    enLanguageId = enLangResponse.body.id;

    // 테스트용 전자공시 생성
    const createResponse = await testSuite
      .request()
      .post('/api/admin/electronic-disclosures')
      .field('translations', JSON.stringify([{
        languageId,
        title: '원본 제목',
        description: '원본 설명',
      }]));
    disclosureId = createResponse.body.id;
  });

  describe('공개 여부 수정', () => {
    it('전자공시를 공개로 변경해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureId}/public`)
        .send({ isPublic: true })
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(true);
    });

    it('전자공시를 비공개로 변경해야 한다', async () => {
      // Given - 먼저 공개로 설정
      await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureId}/public`)
        .send({ isPublic: true });

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(false);
    });
  });

  describe('전자공시 수정', () => {
    it('전자공시의 공개 여부를 수정해야 한다', async () => {
      // Given
      const updateDto = {
        isPublic: true,
      };

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: disclosureId,
        isPublic: true,
      });
    });

    it('전자공시의 번역을 수정해야 한다', async () => {
      // Given
      const koTranslation = (await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)).body.translations
        .find((t: any) => t.languageId === languageId);

      const updateDto = {
        translations: [
          {
            id: koTranslation.id,
            languageId,
            title: '수정된 제목',
            description: '수정된 설명',
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .send(updateDto)
        .expect(200);

      // Then
      const updatedTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId
      );
      expect(updatedTranslation).toMatchObject({
        title: '수정된 제목',
        description: '수정된 설명',
      });
    });

    it('새로운 언어 번역을 추가해야 한다', async () => {
      // Given
      const updateDto = {
        translations: [
          {
            languageId: enLanguageId,
            title: 'New English Title',
            description: 'New English Description',
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.translations.length).toBeGreaterThanOrEqual(2);
      const enTranslation = response.body.translations.find(
        (t: any) => t.languageId === enLanguageId
      );
      expect(enTranslation).toBeDefined();
    });

    it('존재하지 않는 전자공시 수정 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/electronic-disclosures/00000000-0000-0000-0000-000000000001')
        .send({ isPublic: true })
        .expect(404);
    });
  });

  describe('오더 수정', () => {
    it('전자공시의 정렬 순서를 변경해야 한다', async () => {
      // Given
      const updateDto = {
        order: 10,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/electronic-disclosures/${disclosureId}/order`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.order).toBe(10);
    });
  });

  describe('전자공시 삭제', () => {
    it('전자공시를 삭제해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);

      // 삭제 확인
      await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(404);
    });

    it('존재하지 않는 전자공시 삭제 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .delete('/api/admin/electronic-disclosures/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });

    it('삭제된 전자공시는 목록 조회에서 제외되어야 한다', async () => {
      // Given - 전자공시 삭제
      await testSuite
        .request()
        .delete(`/api/admin/electronic-disclosures/${disclosureId}`);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/electronic-disclosures/all')
        .expect(200);

      // Then
      expect(response.body).toHaveLength(0);
    });
  });
});
