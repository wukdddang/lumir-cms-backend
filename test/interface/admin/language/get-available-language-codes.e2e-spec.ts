import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/languages/available-codes (추가 가능한 언어 코드 목록 조회)', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  describe('성공 케이스', () => {
    it('추가 가능한 언어 코드 목록을 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/languages/available-codes')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        codes: expect.any(Array),
        total: expect.any(Number),
      });

      // ISO 639-1 표준은 약 184개의 언어 코드를 가지고 있음
      // 기본 언어 4개(ko, en, ja, zh)가 이미 추가되어 있으므로 180개 정도
      expect(response.body.total).toBeGreaterThan(170);
      expect(response.body.codes.length).toBe(response.body.total);
    });

    it('각 언어 코드는 code, name, nativeName을 포함해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/languages/available-codes')
        .expect(200);

      // Then
      const firstCode = response.body.codes[0];
      expect(firstCode).toMatchObject({
        code: expect.any(String),
        name: expect.any(String),
        nativeName: expect.any(String),
      });
    });

    it('이미 추가된 언어(ko, en, ja, zh)는 목록에 포함되지 않아야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/languages/available-codes')
        .expect(200);

      // Then
      const codes = response.body.codes.map((c: any) => c.code);
      
      // 기본 언어들은 제외되어야 함
      expect(codes).not.toContain('ko'); // 한국어
      expect(codes).not.toContain('en'); // 영어
      expect(codes).not.toContain('ja'); // 일본어
      expect(codes).not.toContain('zh'); // 중국어
    });

    it('추가 가능한 다양한 언어 코드가 포함되어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/languages/available-codes')
        .expect(200);

      // Then
      const codes = response.body.codes.map((c: any) => c.code);
      
      // 주요 언어들 확인 (기본 언어 제외)
      expect(codes).toContain('fr'); // 프랑스어
      expect(codes).toContain('de'); // 독일어
      expect(codes).toContain('es'); // 스페인어
      expect(codes).toContain('it'); // 이탈리아어
      expect(codes).toContain('pt'); // 포르투갈어
      expect(codes).toContain('ru'); // 러시아어
      expect(codes).toContain('ar'); // 아랍어
      expect(codes).toContain('hi'); // 힌디어
    });

    it('언어를 추가하면 해당 언어는 사용 가능 목록에서 제외되어야 한다', async () => {
      // Given - 사용 가능한 코드 조회
      const beforeResponse = await testSuite
        .request()
        .get('/api/admin/languages/available-codes')
        .expect(200);

      const beforeCodes = beforeResponse.body.codes.map((c: any) => c.code);
      expect(beforeCodes).toContain('fr'); // 프랑스어가 있어야 함

      // When - 프랑스어 추가
      await testSuite
        .request()
        .post('/api/admin/languages')
        .send({
          code: 'fr',
          name: 'Français',
          isActive: true,
        })
        .expect(201);

      // Then - 프랑스어가 사용 가능 목록에서 제외됨
      const afterResponse = await testSuite
        .request()
        .get('/api/admin/languages/available-codes')
        .expect(200);

      const afterCodes = afterResponse.body.codes.map((c: any) => c.code);
      expect(afterCodes).not.toContain('fr'); // 프랑스어가 없어야 함
      expect(afterResponse.body.total).toBe(beforeResponse.body.total - 1);
    });
  });
});
