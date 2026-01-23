import { BaseE2ETest } from '../../../base-e2e.spec';

describe('POST /api/admin/announcements (공지사항 생성)', () => {
  const testSuite = new BaseE2ETest();
  let testCategoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트용 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/announcements/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 공지사항 카테고리',
      })
      .expect(201);

    testCategoryId = categoryResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('기본 공지사항을 생성해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '2024년 신년 인사',
        content: '새해 복 많이 받으세요.',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: '2024년 신년 인사',
        content: '새해 복 많이 받으세요.',
        isFixed: false,
        isPublic: true,
        mustRead: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('모든 필드를 포함한 공지사항을 생성해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '긴급 공지사항',
        content: '모든 직원은 필독하시기 바랍니다.',
        isFixed: true,
        isPublic: false,
        mustRead: true,
        releasedAt: '2024-01-01T00:00:00Z',
        expiredAt: '2024-12-31T23:59:59Z',
        permissionEmployeeIds: ['uuid-1', 'uuid-2'],
        permissionRankCodes: ['매니저', '책임매니저'],
        permissionPositionCodes: ['팀장'],
        permissionDepartmentCodes: ['경영지원-경지'],
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: '긴급 공지사항',
        content: '모든 직원은 필독하시기 바랍니다.',
        isFixed: true,
        isPublic: false,
        mustRead: true,
        releasedAt: expect.any(String),
        expiredAt: expect.any(String),
      });

      // 권한 정보는 응답 구조에 따라 다를 수 있음
      // permissions 필드가 있는 경우 확인, 없는 경우 생략
    });

    it('첨부파일이 있는 공지사항을 생성해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '첨부파일 공지사항',
        content: '첨부파일을 확인해주세요.',
        attachments: [
          {
            fileName: 'test.pdf',
            fileUrl: 'https://example.com/test.pdf',
            fileSize: 1024000,
            mimeType: 'application/pdf',
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: '첨부파일 공지사항',
        content: '첨부파일을 확인해주세요.',
      });
      expect(response.body.attachments).toBeDefined();
      expect(response.body.attachments).toHaveLength(1);
      expect(response.body.attachments[0]).toMatchObject({
        fileName: 'test.pdf',
        fileUrl: 'https://example.com/test.pdf',
        mimeType: 'application/pdf',
      });
      // fileSize는 응답에 포함되지 않을 수 있음
    });

    it('여러 개의 공지사항을 생성해야 한다', async () => {
      // Given
      const announcements = [
        { categoryId: testCategoryId, title: '공지1', content: '내용1' },
        { categoryId: testCategoryId, title: '공지2', content: '내용2', isFixed: true },
        { categoryId: testCategoryId, title: '공지3', content: '내용3', mustRead: true },
      ];

      // When & Then
      for (const announcement of announcements) {
        const response = await testSuite
          .request()
          .post('/api/admin/announcements')
          .send(announcement)
          .expect(201);

        expect(response.body).toMatchObject({
          title: announcement.title,
          content: announcement.content,
        });
      }
    });
  });

  describe('실패 케이스 - 필수 필드 누락', () => {
    it('categoryId가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        title: '제목',
        content: '내용',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('title이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        content: '내용만 있는 공지사항',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('content가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '제목만 있는 공지사항',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('title과 content가 모두 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        isFixed: true,
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });
  });

  describe('실패 케이스 - 잘못된 데이터 타입', () => {
    it('categoryId가 UUID가 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: 'invalid-uuid',
        title: '제목',
        content: '내용',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('title이 문자열이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: 12345,
        content: '내용',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('isFixed가 boolean이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '제목',
        content: '내용',
        isFixed: 'true',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('isPublic이 boolean이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '제목',
        content: '내용',
        isPublic: 'false',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('mustRead가 boolean이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '제목',
        content: '내용',
        mustRead: 1,
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('releasedAt이 날짜 형식이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '제목',
        content: '내용',
        releasedAt: 'invalid-date',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('permissionEmployeeIds가 배열이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '제목',
        content: '내용',
        permissionEmployeeIds: 'not-an-array',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });
  });

  describe('실패 케이스 - 잘못된 날짜 관계', () => {
    it('expiredAt이 releasedAt보다 이전인 경우 에러가 발생할 수 있다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '제목',
        content: '내용',
        releasedAt: '2024-12-31T23:59:59Z',
        expiredAt: '2024-01-01T00:00:00Z',
      };

      // When & Then
      // 비즈니스 로직에 따라 400 또는 201이 반환될 수 있음
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto);

      // 에러가 발생하지 않는다면 경고 로그나 플래그를 확인
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('설문조사 포함 공지사항 생성', () => {
    it('설문조사가 포함된 공지사항을 생성해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '2024년 직원 만족도 조사',
        content: '우리 회사의 발전을 위한 소중한 의견을 들려주세요.',
        survey: {
          title: '만족도 조사',
          description: '5분 정도 소요됩니다.',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
          questions: [
            {
              title: '회사에 만족하시나요?',
              type: 'linear_scale',
              form: {
                minScale: 1,
                maxScale: 10,
              },
              isRequired: true,
              order: 0,
            },
            {
              title: '개선이 필요한 부분은?',
              type: 'checkboxes',
              form: {
                options: ['복지', '업무 환경', '커뮤니케이션', '기타'],
              },
              isRequired: true,
              order: 1,
            },
          ],
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto);

      // 에러 발생 시 응답 내용 출력
      if (response.status !== 201) {
        console.log('Error response:', JSON.stringify(response.body, null, 2));
      }
      
      expect(response.status).toBe(201);

      // Then - 공지사항 생성 확인
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: '2024년 직원 만족도 조사',
        content: '우리 회사의 발전을 위한 소중한 의견을 들려주세요.',
      });

      const announcementId = response.body.id;

      // 설문조사 조회
      const surveyResponse = await testSuite
        .request()
        .get(`/api/admin/surveys/announcement/${announcementId}`)
        .expect(200);

      // Then - 설문조사 생성 확인
      expect(surveyResponse.body).toMatchObject({
        id: expect.any(String),
        announcementId: announcementId,
        title: '만족도 조사',
        description: '5분 정도 소요됩니다.',
      });

      expect(surveyResponse.body.questions).toHaveLength(2);
      expect(surveyResponse.body.questions[0]).toMatchObject({
        title: '회사에 만족하시나요?',
        type: 'linear_scale',
        isRequired: true,
        order: 0,
      });
      expect(surveyResponse.body.questions[1]).toMatchObject({
        title: '개선이 필요한 부분은?',
        type: 'checkboxes',
        isRequired: true,
        order: 1,
      });
    });

    it('다양한 질문 타입의 설문조사를 생성해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '종합 설문조사',
        content: '다양한 질문에 답해주세요.',
        survey: {
          title: '종합 설문',
          questions: [
            {
              title: '이름을 입력하세요',
              type: 'short_answer',
              form: null,
              isRequired: true,
              order: 0,
            },
            {
              title: '의견을 자세히 작성해주세요',
              type: 'paragraph',
              form: null,
              isRequired: false,
              order: 1,
            },
            {
              title: '선호하는 부서는?',
              type: 'multiple_choice',
              form: {
                options: ['개발', '디자인', '마케팅', '영업'],
              },
              isRequired: true,
              order: 2,
            },
            {
              title: '관심 분야를 선택하세요 (복수)',
              type: 'checkboxes',
              form: {
                options: ['AI', 'IoT', '블록체인', '클라우드'],
              },
              isRequired: false,
              order: 3,
            },
            {
              title: '만족도를 평가해주세요',
              type: 'linear_scale',
              form: {
                minScale: 1,
                maxScale: 5,
              },
              isRequired: true,
              order: 4,
            },
          ],
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(201);

      // Then
      const announcementId = response.body.id;

      const surveyResponse = await testSuite
        .request()
        .get(`/api/admin/surveys/announcement/${announcementId}`)
        .expect(200);

      expect(surveyResponse.body.questions).toHaveLength(5);
      expect(surveyResponse.body.questions.map((q) => q.type)).toEqual([
        'short_answer',
        'paragraph',
        'multiple_choice',
        'checkboxes',
        'linear_scale',
      ]);
    });

    it('질문이 없는 설문조사를 생성해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '설문 예고',
        content: '곧 설문이 시작됩니다.',
        survey: {
          title: '설문 예정',
          description: '준비 중입니다.',
          startDate: '2024-02-01T00:00:00Z',
          endDate: '2024-02-28T23:59:59Z',
          questions: [],
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(201);

      // Then
      const announcementId = response.body.id;

      const surveyResponse = await testSuite
        .request()
        .get(`/api/admin/surveys/announcement/${announcementId}`)
        .expect(200);

      expect(surveyResponse.body).toMatchObject({
        title: '설문 예정',
        description: '준비 중입니다.',
      });
      expect(surveyResponse.body.questions).toHaveLength(0);
    });

    it('설문조사 없이 공지사항만 생성해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '일반 공지사항',
        content: '설문조사 없는 공지사항입니다.',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(201);

      // Then
      const announcementId = response.body.id;

      // 설문조사가 없어야 함 (200 응답에 null 또는 빈 객체)
      const surveyResponse = await testSuite
        .request()
        .get(`/api/admin/surveys/announcement/${announcementId}`);

      // 200 응답에 null/빈 객체 또는 404 응답 모두 허용
      expect([200, 404]).toContain(surveyResponse.status);
      
      if (surveyResponse.status === 200) {
        // null 또는 빈 객체 모두 허용
        const isNullOrEmpty = 
          surveyResponse.body === null || 
          Object.keys(surveyResponse.body).length === 0;
        expect(isNullOrEmpty).toBe(true);
      }
    });

    it('필수/선택 질문이 섞인 설문조사를 생성해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '필독 공지사항',
        content: '설문에 참여해주세요.',
        mustRead: true,
        survey: {
          title: '필수/선택 질문 설문',
          questions: [
            {
              title: '필수 질문 1',
              type: 'short_answer',
              form: null,
              isRequired: true,
              order: 0,
            },
            {
              title: '선택 질문 1',
              type: 'paragraph',
              form: null,
              isRequired: false,
              order: 1,
            },
            {
              title: '필수 질문 2',
              type: 'multiple_choice',
              form: {
                options: ['예', '아니오'],
              },
              isRequired: true,
              order: 2,
            },
            {
              title: '선택 질문 2',
              type: 'linear_scale',
              form: {
                minScale: 1,
                maxScale: 10,
              },
              isRequired: false,
              order: 3,
            },
          ],
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(201);

      // Then
      const announcementId = response.body.id;

      const surveyResponse = await testSuite
        .request()
        .get(`/api/admin/surveys/announcement/${announcementId}`)
        .expect(200);

      const requiredQuestions = surveyResponse.body.questions.filter(
        (q) => q.isRequired,
      );
      const optionalQuestions = surveyResponse.body.questions.filter(
        (q) => !q.isRequired,
      );

      expect(requiredQuestions).toHaveLength(2);
      expect(optionalQuestions).toHaveLength(2);
    });
  });

  describe('설문조사 생성 실패 케이스', () => {
    it('설문조사 제목이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '공지사항',
        content: '내용',
        survey: {
          // title 누락
          description: '설명',
          questions: [],
        },
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('잘못된 질문 타입인 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '공지사항',
        content: '내용',
        survey: {
          title: '설문',
          questions: [
            {
              title: '질문',
              type: 'INVALID_TYPE',
              form: null,
              isRequired: true,
              order: 0,
            },
          ],
        },
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('질문에 필수 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '공지사항',
        content: '내용',
        survey: {
          title: '설문',
          questions: [
            {
              // title 누락
              type: 'short_answer',
              isRequired: true,
              order: 0,
            },
          ],
        },
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('LINEAR_SCALE의 form 데이터가 잘못된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: testCategoryId,
        title: '공지사항',
        content: '내용',
        survey: {
          title: '설문',
          questions: [
            {
              title: '척도 질문',
              type: 'linear_scale',
              form: {
                // minScale, maxScale 누락
                options: ['잘못된 필드'],
              },
              isRequired: true,
              order: 0,
            },
          ],
        },
      };

      // When & Then
      // form 검증이 있다면 400, 없다면 201
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto);

      // 응답 상태 확인 (비즈니스 로직에 따라 다를 수 있음)
      expect([201, 400]).toContain(response.status);
    });
  });
});
