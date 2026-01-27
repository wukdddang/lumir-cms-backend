import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/languages/available-codes (사용 가능한 언어 코드 목록 조회)', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  describe('성공 케이스', () => {
    it('사용 가능한 언어 코드 목록을 조회해야 한다', async () => {
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
      expect(response.body.total).toBeGreaterThan(150);
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

    it('한국어, 영어, 일본어, 중국어 코드가 포함되어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/languages/available-codes')
        .expect(200);

      // Then
      const codes = response.body.codes.map((c: any) => c.code);
      expect(codes).toContain('ko'); // 한국어
      expect(codes).toContain('en'); // 영어
      expect(codes).toContain('ja'); // 일본어
      expect(codes).toContain('zh'); // 중국어
    });

    it('한국어 정보가 올바르게 반환되어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/languages/available-codes')
        .expect(200);

      // Then
      const koreanCode = response.body.codes.find((c: any) => c.code === 'ko');
      expect(koreanCode).toMatchObject({
        code: 'ko',
        name: 'Korean',
        nativeName: '한국어',
      });
    });

    it('다양한 언어 코드가 포함되어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/languages/available-codes')
        .expect(200);

      // Then
      const codes = response.body.codes.map((c: any) => c.code);
      
      // 주요 언어들 확인
      expect(codes).toContain('fr'); // 프랑스어
      expect(codes).toContain('de'); // 독일어
      expect(codes).toContain('es'); // 스페인어
      expect(codes).toContain('it'); // 이탈리아어
      expect(codes).toContain('pt'); // 포르투갈어
      expect(codes).toContain('ru'); // 러시아어
      expect(codes).toContain('ar'); // 아랍어
      expect(codes).toContain('hi'); // 힌디어
    });
  });
});
