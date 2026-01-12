import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/brochures (브로슈어 목록 조회)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;

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
  });

  describe('성공 케이스', () => {
    it('빈 목록을 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/brochures')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: [],
        total: 0,
      });
    });

    it('등록된 브로슈어 목록을 조회해야 한다', async () => {
      // Given
      const brochures = [
        {
          isPublic: false, // 기본값은 false
          status: 'draft',
          translations: [
            { languageId, title: '브로슈어 1', description: '설명 1' },
          ],
        },
        {
          isPublic: false, // 기본값은 false
          status: 'approved',
          translations: [
            { languageId, title: '브로슈어 2', description: '설명 2' },
          ],
        },
      ];

      for (const brochure of brochures) {
        await testSuite.request().post('/api/admin/brochures').send(brochure);
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/brochures')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(2);
      // 목록 조회는 translations를 포함하지 않고 title, description을 직접 포함
      expect(response.body.items[0]).toHaveProperty('title');
      expect(response.body.items[0]).toHaveProperty('description');
    });
  });
});

describe('GET /api/admin/brochures/:id (브로슈어 상세 조회)', () => {
  const testSuite = new BaseE2ETest();
  let languageId: string;

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
  });

  describe('성공 케이스', () => {
    it('ID로 브로슈어를 조회해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/brochures')
        .send({
          isPublic: false, // 기본값은 false
          status: 'draft',
          translations: [
            {
              languageId,
              title: '회사 소개 브로슈어',
              description: '상세 설명',
            },
          ],
        });

      const brochureId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/brochures/${brochureId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: brochureId,
        isPublic: false, // 기본값 확인
        status: 'draft',
      });
      expect(response.body.translations).toHaveLength(1);
      expect(response.body.translations[0]).toMatchObject({
        title: '회사 소개 브로슈어',
        description: '상세 설명',
      });
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .get(`/api/admin/brochures/${nonExistentId}`)
        .expect(404);
    });
  });
});
