import { BaseE2ETest } from '../../../base-e2e.spec';

describe('언어 활성화/비활성화 통합 시나리오', () => {
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

  describe('언어 활성/비활성 시나리오', () => {
    it('비활성화된 언어는 includeInactive=true로 조회할 수 있어야 한다', async () => {
      // Given - 일본어 비활성화
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const japaneseLanguage = languages.body.items.find(
        (lang: any) => lang.code === 'ja',
      );

      await testSuite
        .request()
        .patch(`/api/admin/languages/${japaneseLanguage.id}/active`)
        .send({ isActive: false })
        .expect(200);

      // When - 활성 언어만 조회
      const activeResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      // Then - 일본어가 없어야 함
      const jaInActiveList = activeResponse.body.items.find(
        (lang: any) => lang.code === 'ja',
      );
      expect(jaInActiveList).toBeUndefined();

      // When - 비활성 포함 조회
      const allResponse = await testSuite
        .request()
        .get('/api/admin/languages?includeInactive=true')
        .expect(200);

      // Then - 일본어가 있어야 함
      const jaInAllList = allResponse.body.items.find(
        (lang: any) => lang.code === 'ja',
      );
      expect(jaInAllList).toBeDefined();
      expect(jaInAllList.isActive).toBe(false);
    });

    it('비활성화된 언어를 다시 활성화하면 같은 ID로 복원되어야 한다', async () => {
      // Given - 중국어 정보 저장
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const chineseLanguage = languages.body.items.find(
        (lang: any) => lang.code === 'zh',
      );
      const originalId = chineseLanguage.id;
      const originalCreatedAt = chineseLanguage.createdAt;

      // When - 중국어 비활성화 후 다시 활성화
      await testSuite
        .request()
        .patch(`/api/admin/languages/${originalId}/active`)
        .send({ isActive: false })
        .expect(200);

      const restoreResponse = await testSuite
        .request()
        .patch(`/api/admin/languages/${originalId}/active`)
        .send({ isActive: true })
        .expect(200);

      // Then - 같은 ID와 createdAt 유지
      expect(restoreResponse.body.id).toBe(originalId);
      expect(restoreResponse.body.createdAt).toBe(originalCreatedAt);
      expect(restoreResponse.body.isActive).toBe(true);
    });

    it('여러 언어를 비활성화/활성화 반복해도 정상 작동해야 한다', async () => {
      // Given
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const ja = languages.body.items.find((l: any) => l.code === 'ja');
      const zh = languages.body.items.find((l: any) => l.code === 'zh');

      // When - 일본어, 중국어 비활성화
      await testSuite
        .request()
        .patch(`/api/admin/languages/${ja.id}/active`)
        .send({ isActive: false })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/languages/${zh.id}/active`)
        .send({ isActive: false })
        .expect(200);

      // Then - 활성 언어 2개만 남음 (en, ko)
      let activeList = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);
      expect(activeList.body.items).toHaveLength(2);

      // When - 일본어 다시 활성화
      await testSuite
        .request()
        .patch(`/api/admin/languages/${ja.id}/active`)
        .send({ isActive: true })
        .expect(200);

      // Then - 활성 언어 3개 (en, ko, ja)
      activeList = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);
      expect(activeList.body.items).toHaveLength(3);

      // When - 중국어 다시 활성화
      await testSuite
        .request()
        .patch(`/api/admin/languages/${zh.id}/active`)
        .send({ isActive: true })
        .expect(200);

      // Then - 활성 언어 4개 (모두 복원)
      activeList = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);
      expect(activeList.body.items).toHaveLength(4);
    });
  });

  describe('언어 순서와 활성 상태 통합 시나리오', () => {
    it('비활성화된 언어의 순서 변경은 404 에러가 발생해야 한다', async () => {
      // Given - 일본어 비활성화
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const japaneseLanguage = languages.body.items.find(
        (lang: any) => lang.code === 'ja',
      );

      await testSuite
        .request()
        .patch(`/api/admin/languages/${japaneseLanguage.id}/active`)
        .send({ isActive: false })
        .expect(200);

      // When & Then - 비활성화된 일본어의 순서 변경 시도 시 404 발생
      await testSuite
        .request()
        .patch(`/api/admin/languages/${japaneseLanguage.id}/order`)
        .send({ order: 10 })
        .expect(404);
    });

    it('언어를 활성화/비활성화해도 순서는 유지되어야 한다', async () => {
      // Given - 일본어 순서를 5로 변경
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const japaneseLanguage = languages.body.items.find(
        (lang: any) => lang.code === 'ja',
      );

      await testSuite
        .request()
        .patch(`/api/admin/languages/${japaneseLanguage.id}/order`)
        .send({ order: 5 })
        .expect(200);

      // When - 일본어 비활성화 후 다시 활성화
      await testSuite
        .request()
        .patch(`/api/admin/languages/${japaneseLanguage.id}/active`)
        .send({ isActive: false })
        .expect(200);

      const restoreResponse = await testSuite
        .request()
        .patch(`/api/admin/languages/${japaneseLanguage.id}/active`)
        .send({ isActive: true })
        .expect(200);

      // Then - 순서가 유지되어야 함
      expect(restoreResponse.body.order).toBe(5);
    });

    it('순서가 설정된 여러 언어를 활성화/비활성화해도 정렬이 유지되어야 한다', async () => {
      // Given - 모든 언어에 순서 설정
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const en = languages.body.items.find((l: any) => l.code === 'en');
      const ko = languages.body.items.find((l: any) => l.code === 'ko');
      const ja = languages.body.items.find((l: any) => l.code === 'ja');
      const zh = languages.body.items.find((l: any) => l.code === 'zh');

      // 순서 설정: ko(1), ja(2), zh(3), en(4)
      await testSuite
        .request()
        .patch(`/api/admin/languages/${ko.id}/order`)
        .send({ order: 1 })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/languages/${ja.id}/order`)
        .send({ order: 2 })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/languages/${zh.id}/order`)
        .send({ order: 3 })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/languages/${en.id}/order`)
        .send({ order: 4 })
        .expect(200);

      // When - ja, zh 비활성화
      await testSuite
        .request()
        .patch(`/api/admin/languages/${ja.id}/active`)
        .send({ isActive: false })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/languages/${zh.id}/active`)
        .send({ isActive: false })
        .expect(200);

      // Then - 활성 언어 목록의 순서는 ko, en 순
      let activeList = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      let codes = activeList.body.items.map((l: any) => l.code);
      expect(codes).toEqual(['ko', 'en']);

      // When - ja, zh 다시 활성화
      await testSuite
        .request()
        .patch(`/api/admin/languages/${ja.id}/active`)
        .send({ isActive: true })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/languages/${zh.id}/active`)
        .send({ isActive: true })
        .expect(200);

      // Then - 전체 순서는 ko, ja, zh, en 순
      activeList = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      codes = activeList.body.items.map((l: any) => l.code);
      expect(codes).toEqual(['ko', 'ja', 'zh', 'en']);
    });
  });
});
