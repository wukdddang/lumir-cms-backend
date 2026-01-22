import { BaseE2ETest } from '../../../base-e2e.spec';
import { ElectronicDisclosureTranslation } from '@domain/core/electronic-disclosure/electronic-disclosure-translation.entity';
import { SyncElectronicDisclosureTranslationsHandler } from '@context/electronic-disclosure-context/handlers/jobs/sync-electronic-disclosure-translations.handler';

describe('전자공시 번역 동기화 API', () => {
  const testSuite = new BaseE2ETest();
  let koreanLanguageId: string;
  let englishLanguageId: string;
  let japaneseLanguageId: string;
  let chineseLanguageId: string;
  let categoryId: string;
  let syncHandler: SyncElectronicDisclosureTranslationsHandler;

  beforeAll(async () => {
    await testSuite.beforeAll();

    // 동기화 핸들러 직접 가져오기 (스케줄러 수동 실행용)
    syncHandler = testSuite.app.get(SyncElectronicDisclosureTranslationsHandler);
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
    
    // 각 테스트마다 언어 ID를 다시 조회 (cleanupBeforeTest가 DB를 초기화하므로)
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);

    const languages = languagesResponse.body.items;
    koreanLanguageId = languages.find((l: any) => l.code === 'ko')?.id;
    englishLanguageId = languages.find((l: any) => l.code === 'en')?.id;
    japaneseLanguageId = languages.find((l: any) => l.code === 'ja')?.id;
    chineseLanguageId = languages.find((l: any) => l.code === 'zh')?.id;

    expect(koreanLanguageId).toBeDefined();
    expect(englishLanguageId).toBeDefined();
    expect(japaneseLanguageId).toBeDefined();
    expect(chineseLanguageId).toBeDefined();

    // 전자공시 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/electronic-disclosures/categories')
      .send({
        name: '테스트 카테고리',
        description: 'E2E 테스트용 카테고리',
        order: 0,
      })
      .expect(201);

    categoryId = categoryResponse.body.id;
  });

  describe('번역 자동 동기화 (isSynced=true)', () => {
    it('한국어를 수정하면 isSynced=true인 타 언어가 자동 동기화되어야 한다', async () => {
      // Given - 한국어로 전자공시 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '원본 한국어 제목',
              description: '원본 한국어 설명',
            },
          ]),
        )
        .expect(201);

      const disclosureId = createResponse.body.id;

      // 자동 생성된 영어 번역 확인 (isSynced=true)
      let englishTranslation = createResponse.body.translations.find(
        (t: any) => t.languageId === englishLanguageId,
      );
      expect(englishTranslation.title).toBe('원본 한국어 제목');
      expect(englishTranslation.isSynced).toBe(true);

      // When - 한국어 번역 수정
      await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '수정된 한국어 제목',
              description: '수정된 한국어 설명',
            },
          ]),
        )
        .expect(200);

      // 스케줄러 수동 실행 (1분마다 자동 실행되는 것을 수동으로 트리거)
      await syncHandler.execute();

      // Then - 영어 번역이 한국어와 동기화되었는지 확인
      const getResponse = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      englishTranslation = getResponse.body.translations.find(
        (t: any) => t.languageId === englishLanguageId,
      );
      expect(englishTranslation.title).toBe('수정된 한국어 제목'); // 동기화됨
      expect(englishTranslation.description).toBe('수정된 한국어 설명');
      expect(englishTranslation.isSynced).toBe(true); // 여전히 true

      // 일본어도 동기화 확인
      const japaneseTranslation = getResponse.body.translations.find(
        (t: any) => t.languageId === japaneseLanguageId,
      );
      expect(japaneseTranslation.title).toBe('수정된 한국어 제목');
      expect(japaneseTranslation.isSynced).toBe(true);
    });

    it('영어를 수동 수정하면 isSynced=false가 되어 더 이상 동기화되지 않아야 한다', async () => {
      // Given - 한국어로 전자공시 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '한국어 제목',
            },
          ]),
        )
        .expect(201);

      const disclosureId = createResponse.body.id;

      // When 1 - 영어 번역 수동 수정
      await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: englishLanguageId,
              title: 'Custom English Title',
              description: 'Custom English Description',
            },
          ]),
        )
        .expect(200);

      // Then 1 - 영어 번역의 isSynced=false 확인
      const getResponse1 = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      const englishTranslation1 = getResponse1.body.translations.find(
        (t: any) => t.languageId === englishLanguageId,
      );
      expect(englishTranslation1.title).toBe('Custom English Title');
      expect(englishTranslation1.isSynced).toBe(false); // 동기화 종료

      // When 2 - 한국어 제목 변경
      await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '한국어 제목 변경됨',
            },
          ]),
        )
        .expect(200);

      // 스케줄러 실행
      await syncHandler.execute();

      // Then 2 - 영어는 동기화되지 않고, 일본어/중국어만 동기화
      const getResponse2 = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      // 영어: 동기화 안 됨 (isSynced=false)
      const englishTranslation2 = getResponse2.body.translations.find(
        (t: any) => t.languageId === englishLanguageId,
      );
      expect(englishTranslation2.title).toBe('Custom English Title'); // 변경 없음
      expect(englishTranslation2.isSynced).toBe(false);

      // 일본어: 동기화됨 (isSynced=true)
      const japaneseTranslation = getResponse2.body.translations.find(
        (t: any) => t.languageId === japaneseLanguageId,
      );
      expect(japaneseTranslation.title).toBe('한국어 제목 변경됨'); // 동기화됨
      expect(japaneseTranslation.isSynced).toBe(true);

      // 중국어: 동기화됨 (isSynced=true)
      const chineseTranslation = getResponse2.body.translations.find(
        (t: any) => t.languageId === chineseLanguageId,
      );
      expect(chineseTranslation.title).toBe('한국어 제목 변경됨'); // 동기화됨
      expect(chineseTranslation.isSynced).toBe(true);
    });

    it('여러 언어를 수동 입력하면 모두 isSynced=false가 되어야 한다', async () => {
      // Given - 한국어, 영어 수동 입력
      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '한국어 제목',
            },
            {
              languageId: englishLanguageId,
              title: 'English Title',
            },
            {
              languageId: japaneseLanguageId,
              title: '日本語タイトル',
            },
          ]),
        )
        .expect(201);

      const disclosureId = createResponse.body.id;

      // Then - 수동 입력한 언어들은 isSynced=false
      const koreanTranslation = createResponse.body.translations.find(
        (t: any) => t.languageId === koreanLanguageId,
      );
      expect(koreanTranslation.isSynced).toBe(false);

      const englishTranslation = createResponse.body.translations.find(
        (t: any) => t.languageId === englishLanguageId,
      );
      expect(englishTranslation.isSynced).toBe(false);

      const japaneseTranslation = createResponse.body.translations.find(
        (t: any) => t.languageId === japaneseLanguageId,
      );
      expect(japaneseTranslation.isSynced).toBe(false);

      // 중국어만 자동 생성 (isSynced=true)
      const chineseTranslation = createResponse.body.translations.find(
        (t: any) => t.languageId === chineseLanguageId,
      );
      expect(chineseTranslation.isSynced).toBe(true);

      // When - 한국어 수정
      await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '한국어 제목 변경',
            },
          ]),
        )
        .expect(200);

      // 스케줄러 실행
      await syncHandler.execute();

      // Then - 중국어만 동기화됨
      const getResponse = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      const updatedChineseTranslation = getResponse.body.translations.find(
        (t: any) => t.languageId === chineseLanguageId,
      );
      expect(updatedChineseTranslation.title).toBe('한국어 제목 변경');
      expect(updatedChineseTranslation.isSynced).toBe(true);

      // 영어, 일본어는 동기화 안 됨
      const updatedEnglishTranslation = getResponse.body.translations.find(
        (t: any) => t.languageId === englishLanguageId,
      );
      expect(updatedEnglishTranslation.title).toBe('English Title'); // 변경 없음

      const updatedJapaneseTranslation = getResponse.body.translations.find(
        (t: any) => t.languageId === japaneseLanguageId,
      );
      expect(updatedJapaneseTranslation.title).toBe('日本語タイトル'); // 변경 없음
    });
  });

  describe('isSynced 필드 직접 확인', () => {
    it('DB에서 isSynced 값을 직접 확인해야 한다', async () => {
      // Given - 전자공시 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: 'DB 확인 테스트',
            },
          ]),
        )
        .expect(201);

      const disclosureId = createResponse.body.id;

      // When - Repository에서 직접 조회
      const translationRepository = testSuite.getRepository(
        ElectronicDisclosureTranslation as any,
      );

      const translations = await translationRepository.find({
        where: { electronicDisclosureId: disclosureId },
        order: { createdAt: 'ASC' },
      });

      // Then
      expect(translations).toHaveLength(4); // ko, en, ja, zh

      const korean = translations.find((t) => t.languageId === koreanLanguageId);
      expect(korean?.isSynced).toBe(false); // 수동 입력

      const english = translations.find((t) => t.languageId === englishLanguageId);
      expect(english?.isSynced).toBe(true); // 자동 생성

      const japanese = translations.find((t) => t.languageId === japaneseLanguageId);
      expect(japanese?.isSynced).toBe(true); // 자동 생성

      const chinese = translations.find((t) => t.languageId === chineseLanguageId);
      expect(chinese?.isSynced).toBe(true); // 자동 생성
    });

    it('번역 수정 후 isSynced 값 변경을 확인해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: 'isSynced 변경 테스트',
            },
          ]),
        )
        .expect(201);

      const disclosureId = createResponse.body.id;

      // When - 영어 수정
      await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: englishLanguageId,
              title: 'Modified English',
            },
          ]),
        )
        .expect(200);

      // Then - DB에서 확인
      const translationRepository = testSuite.getRepository(
        ElectronicDisclosureTranslation as any,
      );

      const translations = await translationRepository.find({
        where: { electronicDisclosureId: disclosureId },
      });

      const english = translations.find((t) => t.languageId === englishLanguageId);
      expect(english?.isSynced).toBe(false); // 수정 후 false로 변경
    });
  });

  describe('동기화 시나리오 종합', () => {
    it('전체 동기화 시나리오가 정상 동작해야 한다', async () => {
      // 1단계: 한국어로 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('categoryId', categoryId)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '시나리오 테스트 v1',
            },
          ]),
        )
        .expect(201);

      const disclosureId = createResponse.body.id;

      // 확인: 모든 언어가 "시나리오 테스트 v1" (ko: false, 나머지: true)
      expect(createResponse.body.translations).toHaveLength(4);

      // 2단계: 한국어 수정
      await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '시나리오 테스트 v2',
            },
          ]),
        )
        .expect(200);

      // 스케줄러 실행
      await syncHandler.execute();

      // 확인: 모든 언어가 "시나리오 테스트 v2"
      const getResponse1 = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      getResponse1.body.translations.forEach((t: any) => {
        expect(t.title).toBe('시나리오 테스트 v2');
      });

      // 3단계: 영어만 수동 수정
      await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: englishLanguageId,
              title: 'Scenario Test v2 (Custom)',
            },
          ]),
        )
        .expect(200);

      // 확인: 영어만 다른 제목, isSynced=false
      const getResponse2 = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      const english2 = getResponse2.body.translations.find(
        (t: any) => t.languageId === englishLanguageId,
      );
      expect(english2.title).toBe('Scenario Test v2 (Custom)');
      expect(english2.isSynced).toBe(false);

      // 4단계: 한국어 재수정
      await testSuite
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field(
          'translations',
          JSON.stringify([
            {
              languageId: koreanLanguageId,
              title: '시나리오 테스트 v3',
            },
          ]),
        )
        .expect(200);

      // 스케줄러 실행
      await syncHandler.execute();

      // 확인: 영어는 "Scenario Test v2 (Custom)" 유지, 일본어/중국어는 "시나리오 테스트 v3"
      const getResponse3 = await testSuite
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      const korean3 = getResponse3.body.translations.find(
        (t: any) => t.languageId === koreanLanguageId,
      );
      expect(korean3.title).toBe('시나리오 테스트 v3');

      const english3 = getResponse3.body.translations.find(
        (t: any) => t.languageId === englishLanguageId,
      );
      expect(english3.title).toBe('Scenario Test v2 (Custom)'); // 변경 없음
      expect(english3.isSynced).toBe(false);

      const japanese3 = getResponse3.body.translations.find(
        (t: any) => t.languageId === japaneseLanguageId,
      );
      expect(japanese3.title).toBe('시나리오 테스트 v3'); // 동기화됨
      expect(japanese3.isSynced).toBe(true);

      const chinese3 = getResponse3.body.translations.find(
        (t: any) => t.languageId === chineseLanguageId,
      );
      expect(chinese3.title).toBe('시나리오 테스트 v3'); // 동기화됨
      expect(chinese3.isSynced).toBe(true);
    });
  });
});
