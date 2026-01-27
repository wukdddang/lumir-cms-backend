import { BaseE2ETest } from '../../../base-e2e.spec';

describe('언어 추가/제외/복원 통합 시나리오', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    testSuite['skipDefaultLanguageInit'] = true;
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  describe('언어 복원 시나리오', () => {
    it('제외된 언어를 다시 추가하면 같은 ID로 복원되어야 한다', async () => {
      // Given - 일본어 추가
      const createResponse = await testSuite
        .request()
        .post('/api/admin/languages')
        .send({
          code: 'ja',
          name: '日本語',
          isActive: true,
        })
        .expect(201);

      const originalId = createResponse.body.id;
      const originalCreatedAt = createResponse.body.createdAt;

      // 언어가 활성 목록에 있는지 확인
      const activeListResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      expect(activeListResponse.body.items).toHaveLength(1);
      expect(activeListResponse.body.items[0].code).toBe('ja');

      // When - 일본어 제외
      await testSuite
        .request()
        .delete(`/api/admin/languages/${originalId}`)
        .expect(200);

      // 제외 후 활성 목록에서 사라졌는지 확인
      const afterDeleteResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      expect(afterDeleteResponse.body.items).toHaveLength(0);

      // 제외된 언어가 available-codes에 나타나는지 확인
      const availableCodesResponse = await testSuite
        .request()
        .get('/api/admin/languages/available-codes')
        .expect(200);

      const availableCodes = availableCodesResponse.body.codes.map((c: any) => c.code);
      expect(availableCodes).toContain('ja');

      // When - 같은 코드(ja)로 다시 추가
      const restoreResponse = await testSuite
        .request()
        .post('/api/admin/languages')
        .send({
          code: 'ja',
          name: '日本語 (복원)',
          isActive: true,
        })
        .expect(201);

      // Then - 검증
      expect(restoreResponse.body.id).toBe(originalId); // 같은 ID
      expect(restoreResponse.body.code).toBe('ja');
      expect(restoreResponse.body.name).toBe('日本語 (복원)'); // 이름 업데이트됨
      expect(restoreResponse.body.isActive).toBe(true);
      expect(restoreResponse.body.createdAt).toBe(originalCreatedAt); // 생성일 유지

      // 복원 후 활성 목록에 다시 나타나는지 확인
      const finalListResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      expect(finalListResponse.body.items).toHaveLength(1);
      expect(finalListResponse.body.items[0].id).toBe(originalId);
      expect(finalListResponse.body.items[0].name).toBe('日本語 (복원)');

      // 복원 후 available-codes에서 사라졌는지 확인
      const finalAvailableCodesResponse = await testSuite
        .request()
        .get('/api/admin/languages/available-codes')
        .expect(200);

      const finalAvailableCodes = finalAvailableCodesResponse.body.codes.map((c: any) => c.code);
      expect(finalAvailableCodes).not.toContain('ja');
    });

    it('여러 언어를 추가/제외/복원 반복해도 정상 작동해야 한다', async () => {
      // 한국어 추가
      const koResponse = await testSuite
        .request()
        .post('/api/admin/languages')
        .send({ code: 'ko', name: '한국어', isActive: true })
        .expect(201);

      const koId = koResponse.body.id;

      // 영어 추가
      const enResponse = await testSuite
        .request()
        .post('/api/admin/languages')
        .send({ code: 'en', name: 'English', isActive: true })
        .expect(201);

      const enId = enResponse.body.id;

      // 활성 언어 2개 확인
      let listResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);
      expect(listResponse.body.items).toHaveLength(2);

      // 한국어 제외
      await testSuite.request().delete(`/api/admin/languages/${koId}`).expect(200);

      listResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);
      expect(listResponse.body.items).toHaveLength(1);
      expect(listResponse.body.items[0].code).toBe('en');

      // 한국어 복원
      const koRestoreResponse = await testSuite
        .request()
        .post('/api/admin/languages')
        .send({ code: 'ko', name: '한국어 (복원)', isActive: true })
        .expect(201);

      expect(koRestoreResponse.body.id).toBe(koId);

      // 활성 언어 2개 복구 확인
      listResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);
      expect(listResponse.body.items).toHaveLength(2);

      // 영어 제외
      await testSuite.request().delete(`/api/admin/languages/${enId}`).expect(200);

      listResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);
      expect(listResponse.body.items).toHaveLength(1);
      expect(listResponse.body.items[0].code).toBe('ko');

      // 영어 복원
      const enRestoreResponse = await testSuite
        .request()
        .post('/api/admin/languages')
        .send({ code: 'en', name: 'English (Restored)', isActive: true })
        .expect(201);

      expect(enRestoreResponse.body.id).toBe(enId);

      // 최종 확인
      listResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);
      expect(listResponse.body.items).toHaveLength(2);

      const codes = listResponse.body.items.map((item: any) => item.code);
      expect(codes).toContain('ko');
      expect(codes).toContain('en');
    });

    it('제외된 언어는 includeInactive=true로 조회할 수 있어야 한다', async () => {
      // 프랑스어 추가
      const frResponse = await testSuite
        .request()
        .post('/api/admin/languages')
        .send({ code: 'fr', name: 'Français', isActive: true })
        .expect(201);

      const frId = frResponse.body.id;

      // 활성 언어 목록 확인
      let activeResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);
      expect(activeResponse.body.items).toHaveLength(1);

      // 프랑스어 제외
      await testSuite.request().delete(`/api/admin/languages/${frId}`).expect(200);

      // 활성 언어 목록 (제외됨)
      activeResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);
      expect(activeResponse.body.items).toHaveLength(0);

      // 비활성 포함 목록 (존재)
      const inactiveResponse = await testSuite
        .request()
        .get('/api/admin/languages?includeInactive=true')
        .expect(200);

      expect(inactiveResponse.body.items).toHaveLength(1);
      expect(inactiveResponse.body.items[0].id).toBe(frId);
      expect(inactiveResponse.body.items[0].code).toBe('fr');
      expect(inactiveResponse.body.items[0].isActive).toBe(false);
    });
  });
});
