import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PATCH /api/admin/languages/:id/order (언어 순서 변경)', () => {
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
    it('언어의 순서를 변경할 수 있어야 한다', async () => {
      // Given
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const koreanLanguage = languages.body.items.find(
        (lang: any) => lang.code === 'ko',
      );

      // When - 한국어 순서를 5로 변경
      const response = await testSuite
        .request()
        .patch(`/api/admin/languages/${koreanLanguage.id}/order`)
        .send({ order: 5 })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: koreanLanguage.id,
        code: 'ko',
        order: 5,
      });
    });

    it('여러 언어의 순서를 변경하면 목록 조회 시 순서대로 나와야 한다', async () => {
      // Given
      const initialLanguages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const languages = initialLanguages.body.items;
      const en = languages.find((l: any) => l.code === 'en');
      const ko = languages.find((l: any) => l.code === 'ko');
      const ja = languages.find((l: any) => l.code === 'ja');
      const zh = languages.find((l: any) => l.code === 'zh');

      // When - 순서 변경 (en: 3, ko: 1, ja: 4, zh: 2)
      await testSuite
        .request()
        .patch(`/api/admin/languages/${en.id}/order`)
        .send({ order: 3 })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/languages/${ko.id}/order`)
        .send({ order: 1 })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/languages/${ja.id}/order`)
        .send({ order: 4 })
        .expect(200);

      await testSuite
        .request()
        .patch(`/api/admin/languages/${zh.id}/order`)
        .send({ order: 2 })
        .expect(200);

      // Then - 순서대로 조회되는지 확인
      const orderedLanguages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const codes = orderedLanguages.body.items.map((l: any) => l.code);
      expect(codes).toEqual(['ko', 'zh', 'en', 'ja']);
    });

    it('순서를 0으로 설정할 수 있어야 한다', async () => {
      // Given
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const language = languages.body.items[0];

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/languages/${language.id}/order`)
        .send({ order: 0 })
        .expect(200);

      // Then
      expect(response.body.order).toBe(0);
    });

    it('음수 순서도 설정할 수 있어야 한다', async () => {
      // Given
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const language = languages.body.items[0];

      // When - 음수 순서 설정
      const response = await testSuite
        .request()
        .patch(`/api/admin/languages/${language.id}/order`)
        .send({ order: -1 })
        .expect(200);

      // Then
      expect(response.body.order).toBe(-1);

      // 목록 조회 시 가장 앞에 와야 함
      const orderedLanguages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      expect(orderedLanguages.body.items[0].id).toBe(language.id);
    });

    it('큰 숫자 순서도 설정할 수 있어야 한다', async () => {
      // Given
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const language = languages.body.items[0];

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/languages/${language.id}/order`)
        .send({ order: 9999 })
        .expect(200);

      // Then
      expect(response.body.order).toBe(9999);
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 언어 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given
      const fakeId = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/languages/${fakeId}/order`)
        .send({ order: 1 })
        .expect(404);
    });

    it('order 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const language = languages.body.items[0];

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/languages/${language.id}/order`)
        .send({})
        .expect(400);
    });

    it('order가 숫자가 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const language = languages.body.items[0];

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/languages/${language.id}/order`)
        .send({ order: '1' })
        .expect(400);
    });

    it('order에 소수점이 포함된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const languages = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const language = languages.body.items[0];

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/languages/${language.id}/order`)
        .send({ order: 1.5 })
        .expect(400);
    });
  });
});
