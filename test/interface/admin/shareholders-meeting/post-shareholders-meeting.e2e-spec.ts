import { BaseE2ETest } from '../../../base-e2e.spec';

describe('POST /api/admin/shareholders-meetings (주주총회 생성)', () => {
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

    // 이미 초기화된 한국어 언어를 조회
    const languagesResponse = await testSuite
      .request()
      .get('/api/admin/languages')
      .expect(200);

    const koreanLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'ko',
    );

    languageId = koreanLanguage.id;
  });

  describe('성공 케이스', () => {
    it('유효한 데이터로 주주총회를 생성해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '제38기 정기 주주총회',
            description: '2024년 정기 주주총회 안내',
          },
        ],
        location: '서울특별시 강남구 테헤란로 루미르 본사',
        meetingDate: '2024-03-15T10:00:00.000Z',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        isPublic: true, // 기본값 확인
        location: createDto.location,
        meetingDate: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // 자동 번역 동기화로 인해 4개 언어 모두 번역이 생성됨
      expect(response.body.translations).toHaveLength(4);

      // 한국어 번역 확인 (isSynced: false, 수동 입력)
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation).toMatchObject({
        languageId,
        title: '제38기 정기 주주총회',
        description: '2024년 정기 주주총회 안내',
        isSynced: false,
      });

      // 다른 언어들은 자동 동기화됨 (isSynced: true)
      const syncedTranslations = response.body.translations.filter(
        (t: any) => t.languageId !== languageId,
      );
      expect(syncedTranslations).toHaveLength(3);
      syncedTranslations.forEach((t: any) => {
        expect(t.isSynced).toBe(true);
        expect(t.title).toBe('제38기 정기 주주총회');
      });
    });

    it('여러 언어 번역을 포함한 주주총회를 생성해야 한다', async () => {
      // Given - 이미 초기화된 영어 언어를 조회
      const languagesResponse = await testSuite
        .request()
        .get('/api/admin/languages')
        .expect(200);

      const englishLanguage = languagesResponse.body.items.find(
        (lang: any) => lang.code === 'en',
      );
      const enLanguageId = englishLanguage.id;

      const createDto = {
        translations: [
          {
            languageId,
            title: '제38기 정기 주주총회',
            description: '2024년 정기 주주총회 안내',
          },
          {
            languageId: enLanguageId,
            title: '38th Annual Shareholders Meeting',
            description: '2024 Annual Shareholders Meeting Notice',
          },
        ],
        location: '서울 강남구',
        meetingDate: '2024-03-15T10:00:00.000Z',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send(createDto)
        .expect(201);

      // Then
      // 한국어, 영어는 수동 입력(isSynced: false), 일본어, 중국어는 자동 동기화(isSynced: true)
      expect(response.body.translations).toHaveLength(4);

      // 수동 입력된 번역 확인
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation.isSynced).toBe(false);

      const enTranslation = response.body.translations.find(
        (t: any) => t.languageId === enLanguageId,
      );
      expect(enTranslation.isSynced).toBe(false);
      expect(enTranslation.title).toBe('38th Annual Shareholders Meeting');
    });

    it('의결 결과를 포함한 주주총회를 생성해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '제38기 정기 주주총회',
            description: '2024년 정기 주주총회 안내',
          },
        ],
        location: '서울 강남구',
        meetingDate: '2024-03-15T10:00:00.000Z',
        voteResults: [
          {
            agendaNumber: 1,
            totalVote: 1000,
            yesVote: 850,
            noVote: 150,
            approvalRating: 85.0,
            result: 'accepted',
            translations: [
              {
                languageId,
                title: '제1호 안건: 재무제표 승인',
              },
            ],
          },
          {
            agendaNumber: 2,
            totalVote: 1000,
            yesVote: 920,
            noVote: 80,
            approvalRating: 92.0,
            result: 'accepted',
            translations: [
              {
                languageId,
                title: '제2호 안건: 이사 선임',
              },
            ],
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.voteResults).toHaveLength(2);

      // 첫 번째 안건 확인
      const firstAgenda = response.body.voteResults.find(
        (v: any) => v.agendaNumber === 1,
      );
      expect(firstAgenda).toMatchObject({
        agendaNumber: 1,
        totalVote: 1000,
        yesVote: 850,
        noVote: 150,
        approvalRating: 85.0,
        result: 'accepted',
      });
      expect(firstAgenda.translations).toHaveLength(4); // 4개 언어

      // 두 번째 안건 확인
      const secondAgenda = response.body.voteResults.find(
        (v: any) => v.agendaNumber === 2,
      );
      expect(secondAgenda.agendaNumber).toBe(2);
      expect(secondAgenda.approvalRating).toBe(92.0);
    });

    it('description 없이 주주총회를 생성해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '제38기 정기 주주총회',
          },
        ],
        location: '서울 강남구',
        meetingDate: '2024-03-15T10:00:00.000Z',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send(createDto)
        .expect(201);

      // Then
      // 자동 번역 동기화로 4개 언어 생성
      expect(response.body.translations).toHaveLength(4);

      // 한국어 번역 확인
      const koTranslation = response.body.translations.find(
        (t: any) => t.languageId === languageId,
      );
      expect(koTranslation.title).toBe('제38기 정기 주주총회');
      expect(koTranslation.description).toBeNull();
    });
  });

  describe('실패 케이스 - 필수 필드 누락', () => {
    it('translations가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        location: '서울 강남구',
        meetingDate: '2024-03-15T10:00:00.000Z',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send(createDto)
        .expect(400);
    });

    it('location이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '제38기 정기 주주총회',
          },
        ],
        meetingDate: '2024-03-15T10:00:00.000Z',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send(createDto)
        .expect(400);
    });

    it('meetingDate가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '제38기 정기 주주총회',
          },
        ],
        location: '서울 강남구',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send(createDto)
        .expect(400);
    });

    it('translation의 title이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given - title 없이 생성 시도
      const createDto = {
        translations: [
          {
            languageId,
            description: '설명만 있음',
            // title 없음
          },
        ],
        location: '서울 강남구',
        meetingDate: '2024-03-15T10:00:00.000Z',
      };

      // When & Then - DTO validation에서 400 에러 발생
      await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send(createDto)
        .expect(400);
    });
  });

  describe('실패 케이스 - 잘못된 데이터', () => {
    it('존재하지 않는 languageId로 생성 시 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId: '00000000-0000-0000-0000-000000000001',
            title: '테스트',
          },
        ],
        location: '서울 강남구',
        meetingDate: '2024-03-15T10:00:00.000Z',
      };

      // When & Then
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send(createDto);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('잘못된 날짜 형식으로 생성 시 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '제38기 정기 주주총회',
          },
        ],
        location: '서울 강남구',
        meetingDate: 'invalid-date',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send(createDto)
        .expect(400);
    });

    it('의결 결과의 필수 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '제38기 정기 주주총회',
          },
        ],
        location: '서울 강남구',
        meetingDate: '2024-03-15T10:00:00.000Z',
        voteResults: [
          {
            agendaNumber: 1,
            // totalVote, yesVote 등 필수 필드 누락
            translations: [
              {
                languageId,
                title: '제1호 안건',
              },
            ],
          },
        ],
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send(createDto)
        .expect(400);
    });

    it('잘못된 의결 결과 타입으로 생성 시 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        translations: [
          {
            languageId,
            title: '제38기 정기 주주총회',
          },
        ],
        location: '서울 강남구',
        meetingDate: '2024-03-15T10:00:00.000Z',
        voteResults: [
          {
            agendaNumber: 1,
            totalVote: 1000,
            yesVote: 850,
            noVote: 150,
            approvalRating: 85.0,
            result: 'invalid_result', // 잘못된 결과 타입
            translations: [
              {
                languageId,
                title: '제1호 안건',
              },
            ],
          },
        ],
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .send(createDto)
        .expect(400);
    });
  });

  describe('파일 업로드 케이스', () => {
    it('첨부파일과 함께 주주총회를 생성해야 한다', async () => {
      // Given - 첨부파일 생성
      const fileBuffer = Buffer.from('테스트 파일 내용');

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId,
              title: '제38기 정기 주주총회',
              description: '파일 첨부된 주주총회',
            },
          ]),
        )
        .field('location', '서울 강남구')
        .field('meetingDate', '2024-03-15T10:00:00.000Z')
        .attach('files', fileBuffer, 'meeting-minutes.pdf')
        .expect(201);

      // Then
      expect(response.body.attachments).toBeDefined();
      expect(response.body.attachments).not.toBeNull();
      expect(response.body.attachments).toHaveLength(1);
      expect(response.body.attachments[0]).toMatchObject({
        fileName: expect.any(String),
        fileUrl: expect.any(String),
        fileSize: expect.any(Number),
        mimeType: expect.any(String),
      });
    });

    it('여러 첨부파일과 함께 주주총회를 생성해야 한다', async () => {
      // Given
      const file1Buffer = Buffer.from('첫 번째 파일');
      const file2Buffer = Buffer.from('두 번째 파일');

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/shareholders-meetings')
        .field(
          'translations',
          JSON.stringify([
            {
              languageId,
              title: '제38기 정기 주주총회',
            },
          ]),
        )
        .field('location', '서울 강남구')
        .field('meetingDate', '2024-03-15T10:00:00.000Z')
        .attach('files', file1Buffer, 'minutes.pdf')
        .attach('files', file2Buffer, 'report.pdf')
        .expect(201);

      // Then
      expect(response.body.attachments).toHaveLength(2);
    });
  });
});
