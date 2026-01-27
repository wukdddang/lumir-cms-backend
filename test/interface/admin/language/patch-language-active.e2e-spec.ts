import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PATCH /api/admin/languages/:id/active (언어 활성 상태 수정)', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
    await testSuite.initializeDefaultLanguages();
  });

  describe('성공 케이스', () => {
    it('활성 언어를 비활성화할 수 있어야 한다', async () => {
      // Given - 일본어 추가
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const japaneseLanguage = languages.body.items.find(
        (lang: any) => lang.code === 'ja',
      );

      // When - 일본어 비활성화
      const response = await testSuite
        .request()
        .patch(`/api/admin/languages/${japaneseLanguage.id}/active`)
        .send({ isActive: false })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: japaneseLanguage.id,
        code: 'ja',
        isActive: false,
      });

      // 언어 목록에서 사라졌는지 확인
      const listResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const jaInList = listResponse.body.items.find(
        (lang: any) => lang.code === 'ja',
      );
      expect(jaInList).toBeUndefined();
    });

    it('비활성화된 언어를 다시 활성화할 수 있어야 한다', async () => {
      // Given - 중국어 비활성화
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const chineseLanguage = languages.body.items.find(
        (lang: any) => lang.code === 'zh',
      );

      await testSuite
        .request()
        .patch(`/api/admin/languages/${chineseLanguage.id}/active`)
        .send({ isActive: false })
        .expect(200);

      // When - 중국어 다시 활성화
      const response = await testSuite
        .request()
        .patch(`/api/admin/languages/${chineseLanguage.id}/active`)
        .send({ isActive: true })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: chineseLanguage.id,
        code: 'zh',
        isActive: true,
      });

      // 언어 목록에 다시 나타나는지 확인
      const listResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const zhInList = listResponse.body.items.find(
        (lang: any) => lang.code === 'zh',
      );
      expect(zhInList).toBeDefined();
      expect(zhInList.id).toBe(chineseLanguage.id);
    });

    it('여러 번 활성/비활성을 반복할 수 있어야 한다', async () => {
      // Given
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const japaneseLanguage = languages.body.items.find(
        (lang: any) => lang.code === 'ja',
      );
      const originalId = japaneseLanguage.id;

      // When & Then - 비활성화
      await testSuite
        .request()
        .patch(`/api/admin/languages/${originalId}/active`)
        .send({ isActive: false })
        .expect(200);

      // 활성화
      await testSuite
        .request()
        .patch(`/api/admin/languages/${originalId}/active`)
        .send({ isActive: true })
        .expect(200);

      // 다시 비활성화
      await testSuite
        .request()
        .patch(`/api/admin/languages/${originalId}/active`)
        .send({ isActive: false })
        .expect(200);

      // 최종 활성화
      const finalResponse = await testSuite
        .request()
        .patch(`/api/admin/languages/${originalId}/active`)
        .send({ isActive: true })
        .expect(200);

      // Then - 같은 ID 유지
      expect(finalResponse.body.id).toBe(originalId);
      expect(finalResponse.body.isActive).toBe(true);
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 언어 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given
      const fakeId = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/languages/${fakeId}/active`)
        .send({ isActive: false })
        .expect(404);
    });

    it('기본 언어(ko)를 비활성화하려고 하면 400 에러가 발생해야 한다', async () => {
      // Given - 한국어(ko) 찾기
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const koreanLanguage = languages.body.items.find(
        (lang: any) => lang.code === 'ko',
      );

      // When & Then - 한국어 비활성화 시도
      const response = await testSuite
        .request()
        .patch(`/api/admin/languages/${koreanLanguage.id}/active`)
        .send({ isActive: false })
        .expect(400);

      expect(response.body.message).toContain('기본 언어');
      expect(response.body.message).toContain('비활성화할 수 없습니다');
    });

    it('isActive 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const language = languages.body.items[0];

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/languages/${language.id}/active`)
        .send({})
        .expect(400);
    });

    it('isActive가 boolean이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const language = languages.body.items[0];

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/languages/${language.id}/active`)
        .send({ isActive: 'true' })
        .expect(400);
    });
  });
});
