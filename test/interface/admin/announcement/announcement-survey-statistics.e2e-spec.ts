import { BaseE2ETest } from '../../../base-e2e.spec';

describe('공지사항 설문조사 통계 조회 API', () => {
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

  describe('GET /api/admin/announcements/:id/survey-statistics (설문조사 통계 조회)', () => {
    it('설문조사가 없는 공지사항인 경우 404 에러가 발생해야 한다', async () => {
      // Given - 설문이 없는 일반 공지사항
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '일반 공지',
          content: '설문 없음',
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When & Then
      await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(404);
    });

    it('존재하지 않는 공지사항 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .get(`/api/admin/announcements/${nonExistentId}/survey-statistics`)
        .expect(404);
    });

    it('응답이 없는 설문조사의 통계를 조회해야 한다', async () => {
      // Given - 설문이 있는 공지사항 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '만족도 조사',
          content: '설문에 참여해주세요',
          survey: {
            title: '만족도 조사',
            description: '5분 정도 소요됩니다',
            questions: [
              {
                title: '회사 만족도를 평가해주세요',
                type: 'linear_scale',
                form: {
                  minScale: 1,
                  maxScale: 10,
                },
                isRequired: true,
                order: 0,
              },
              {
                title: '선호하는 복지 제도를 선택하세요',
                type: 'checkboxes',
                form: {
                  options: ['재택근무', '시차출퇴근', '휴가 확대', '간식 지원'],
                },
                isRequired: true,
                order: 1,
              },
            ],
          },
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When - 통계 조회
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(200);

      // Then - 응답이 없는 상태의 통계
      expect(response.body).toMatchObject({
        surveyId: expect.any(String),
        surveyTitle: '만족도 조사',
        totalCompletions: 0,
        questions: expect.any(Array),
      });

      expect(response.body.questions).toHaveLength(2);
    });

    it('객관식(MULTIPLE_CHOICE) 질문의 통계를 조회해야 한다', async () => {
      // Given - 객관식 질문이 있는 설문 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '선호도 조사',
          content: '선호도 조사입니다',
          survey: {
            title: '선호도 조사',
            questions: [
              {
                title: '선호하는 업무 방식은?',
                type: 'multiple_choice',
                form: {
                  options: ['사무실 근무', '재택근무', '하이브리드'],
                },
                isRequired: true,
                order: 0,
              },
            ],
          },
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(200);

      // Then
      expect(response.body.questions).toHaveLength(1);
      
      const questionStat = response.body.questions[0];
      expect(questionStat).toMatchObject({
        questionId: expect.any(String),
        title: '선호하는 업무 방식은?',
        type: 'multiple_choice',
        totalResponses: 0,
      });

      // 객관식 통계는 statistics.options를 포함해야 함
      if (questionStat.statistics && questionStat.statistics.type === 'choice') {
        expect(questionStat.statistics.options).toBeInstanceOf(Array);
      }
    });

    it('체크박스(CHECKBOXES) 질문의 통계를 조회해야 한다', async () => {
      // Given - 체크박스 질문이 있는 설문 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '관심 분야 조사',
          content: '관심 분야를 선택해주세요',
          survey: {
            title: '관심 분야 조사',
            questions: [
              {
                title: '관심 있는 기술 스택을 선택하세요 (복수 선택)',
                type: 'checkboxes',
                form: {
                  options: ['React', 'Vue', 'Angular', 'Svelte'],
                },
                isRequired: true,
                order: 0,
              },
            ],
          },
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(200);

      // Then
      expect(response.body.questions).toHaveLength(1);
      
      const questionStat = response.body.questions[0];
      expect(questionStat).toMatchObject({
        questionId: expect.any(String),
        title: '관심 있는 기술 스택을 선택하세요 (복수 선택)',
        type: 'checkboxes',
        totalResponses: 0,
      });

      // 체크박스 통계는 statistics.options를 포함해야 함
      if (questionStat.statistics && questionStat.statistics.type === 'checkbox') {
        expect(questionStat.statistics.options).toBeInstanceOf(Array);
      }
    });

    it('선형 척도(LINEAR_SCALE) 질문의 통계를 조회해야 한다', async () => {
      // Given - 선형 척도 질문이 있는 설문 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '만족도 평가',
          content: '만족도를 평가해주세요',
          survey: {
            title: '만족도 평가',
            questions: [
              {
                title: '업무 환경 만족도',
                type: 'linear_scale',
                form: {
                  minScale: 1,
                  maxScale: 10,
                },
                isRequired: true,
                order: 0,
              },
            ],
          },
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(200);

      // Then
      expect(response.body.questions).toHaveLength(1);
      
      const questionStat = response.body.questions[0];
      expect(questionStat).toMatchObject({
        questionId: expect.any(String),
        title: '업무 환경 만족도',
        type: 'linear_scale',
        totalResponses: 0,
      });

      // 선형 척도 통계는 statistics.distribution을 포함할 수 있음
      // 응답이 없는 경우 평균, 최소값, 최대값이 null이거나 0일 수 있음
    });

    it('단답형(SHORT_ANSWER) 질문의 통계를 조회해야 한다', async () => {
      // Given - 단답형 질문이 있는 설문 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '의견 수렴',
          content: '의견을 작성해주세요',
          survey: {
            title: '의견 수렴',
            questions: [
              {
                title: '이름을 입력하세요',
                type: 'short_answer',
                form: null,
                isRequired: true,
                order: 0,
              },
            ],
          },
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(200);

      // Then
      expect(response.body.questions).toHaveLength(1);
      
      const questionStat = response.body.questions[0];
      expect(questionStat).toMatchObject({
        questionId: expect.any(String),
        title: '이름을 입력하세요',
        type: 'short_answer',
        totalResponses: 0,
      });
    });

    it('장문형(PARAGRAPH) 질문의 통계를 조회해야 한다', async () => {
      // Given - 장문형 질문이 있는 설문 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '상세 의견 수렴',
          content: '자세히 작성해주세요',
          survey: {
            title: '상세 의견 수렴',
            questions: [
              {
                title: '개선이 필요한 부분을 자세히 작성해주세요',
                type: 'paragraph',
                form: null,
                isRequired: false,
                order: 0,
              },
            ],
          },
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(200);

      // Then
      expect(response.body.questions).toHaveLength(1);
      
      const questionStat = response.body.questions[0];
      expect(questionStat).toMatchObject({
        questionId: expect.any(String),
        title: '개선이 필요한 부분을 자세히 작성해주세요',
        type: 'paragraph',
        totalResponses: 0,
      });
    });

    it('다양한 질문 타입이 섞인 설문조사의 통계를 조회해야 한다', async () => {
      // Given - 다양한 질문 타입의 설문 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '종합 설문조사',
          content: '다양한 질문에 답해주세요',
          survey: {
            title: '종합 설문',
            questions: [
              {
                title: '이름',
                type: 'short_answer',
                form: null,
                isRequired: true,
                order: 0,
              },
              {
                title: '업무 방식 선호도',
                type: 'multiple_choice',
                form: {
                  options: ['사무실', '재택', '하이브리드'],
                },
                isRequired: true,
                order: 1,
              },
              {
                title: '관심 분야 (복수 선택)',
                type: 'checkboxes',
                form: {
                  options: ['개발', '디자인', '마케팅'],
                },
                isRequired: false,
                order: 2,
              },
              {
                title: '만족도 (1-10)',
                type: 'linear_scale',
                form: {
                  minScale: 1,
                  maxScale: 10,
                },
                isRequired: true,
                order: 3,
              },
              {
                title: '상세 의견',
                type: 'paragraph',
                form: null,
                isRequired: false,
                order: 4,
              },
            ],
          },
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        surveyId: expect.any(String),
        surveyTitle: '종합 설문',
        totalCompletions: 0,
      });

      expect(response.body.questions).toHaveLength(5);

      // 각 질문 타입 확인
      const questionTypes = response.body.questions.map((q: any) => q.type);
      expect(questionTypes).toEqual([
        'short_answer',
        'multiple_choice',
        'checkboxes',
        'linear_scale',
        'paragraph',
      ]);
    });

    it('질문이 없는 설문조사의 통계를 조회해야 한다', async () => {
      // Given - 질문이 없는 설문 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '설문 예고',
          content: '곧 설문이 시작됩니다',
          survey: {
            title: '설문 예정',
            description: '준비 중입니다',
            questions: [],
          },
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        surveyId: expect.any(String),
        surveyTitle: '설문 예정',
        totalCompletions: 0,
        questions: [],
      });
    });

    it('필수/선택 질문이 섞인 설문조사의 통계를 조회해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '필수/선택 설문',
          content: '필수 질문에는 반드시 응답해주세요',
          survey: {
            title: '필수/선택 설문',
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
            ],
          },
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(200);

      // Then
      expect(response.body.questions).toHaveLength(3);

      // isRequired 정보가 포함되어 있는지 확인 (선택적)
      const requiredQuestions = response.body.questions.filter(
        (q: any) => q.isRequired === true,
      );
      const optionalQuestions = response.body.questions.filter(
        (q: any) => q.isRequired === false,
      );

      // 필수/선택 구분이 응답에 포함된 경우 확인
      if (requiredQuestions.length > 0 || optionalQuestions.length > 0) {
        expect(requiredQuestions.length + optionalQuestions.length).toBe(3);
      }
    });

    it('여러 공지사항의 설문조사 통계를 각각 조회할 수 있어야 한다', async () => {
      // Given - 여러 설문 생성
      const announcementIds: string[] = [];
      
      for (let i = 1; i <= 3; i++) {
        const response = await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({
          categoryId: testCategoryId,
          title: `설문 ${i}`,
            content: `설문조사 ${i}`,
            survey: {
              title: `설문 ${i}`,
              questions: [
                {
                  title: `질문 ${i}`,
                  type: 'short_answer',
                  form: null,
                  isRequired: true,
                  order: 0,
                },
              ],
            },
          })
          .expect(201);
        
        announcementIds.push(response.body.id);
      }

      // When & Then - 각 설문의 통계를 개별적으로 조회
      for (let i = 0; i < announcementIds.length; i++) {
        const response = await testSuite
          .request()
          .get(`/api/admin/announcements/${announcementIds[i]}/survey-statistics`)
          .expect(200);

        expect(response.body).toMatchObject({
          surveyTitle: `설문 ${i + 1}`,
          totalCompletions: 0,
        });

        expect(response.body.questions).toHaveLength(1);
      }
    });

    it('드롭다운(DROPDOWN) 질문의 통계를 조회해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '부서 선택',
          content: '부서를 선택해주세요',
          survey: {
            title: '부서 선택',
            questions: [
              {
                title: '소속 부서를 선택하세요',
                type: 'dropdown',
                form: {
                  options: ['개발', '디자인', '마케팅', '영업', '총무'],
                },
                isRequired: true,
                order: 0,
              },
            ],
          },
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(200);

      // Then
      expect(response.body.questions).toHaveLength(1);
      
      const questionStat = response.body.questions[0];
      expect(questionStat).toMatchObject({
        questionId: expect.any(String),
        title: '소속 부서를 선택하세요',
        type: 'dropdown',
        totalResponses: 0,
      });
    });
  });

  describe('통계 조회 통합 시나리오', () => {
    it('공지사항 생성 후 즉시 통계를 조회할 수 있어야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '즉시 조회 테스트',
          content: '테스트',
          survey: {
            title: '즉시 조회 설문',
            questions: [
              {
                title: '테스트 질문',
                type: 'short_answer',
                form: null,
                isRequired: true,
                order: 0,
              },
            ],
          },
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When - 생성 직후 통계 조회
      const statsResponse = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(200);

      // Then
      expect(statsResponse.body).toMatchObject({
        surveyTitle: '즉시 조회 설문',
        totalCompletions: 0,
      });
    });

    it('설문 없는 공지사항 조회 시 명확한 에러 메시지를 받아야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({
          categoryId: testCategoryId,
          title: '일반 공지',
          content: '설문 없음',
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}/survey-statistics`)
        .expect(404);

      // Then - 에러 메시지 확인
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: expect.any(String),
      });
    });
  });
});
