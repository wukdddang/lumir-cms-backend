import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestSuiteHelper, TestDataBuilder } from '../../helpers';

describe('GET /announcement-popups (E2E)', () => {
  let app: INestApplication;
  let testSuite: TestSuiteHelper;
  let testDataBuilder: TestDataBuilder;

  beforeAll(async () => {
    testSuite = new TestSuiteHelper();
    app = await testSuite.initializeApp();
    testDataBuilder = new TestDataBuilder(testSuite.getDataSource());
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  describe('성공 케이스', () => {
    it('모든 공지사항 팝업을 조회해야 한다', async () => {
      // Given: 3개의 팝업 생성
      await testDataBuilder.여러_공지사항_팝업을_생성한다(3);

      // When
      const response = await request(app.getHttpServer())
        .get('/announcement-popups')
        .expect(200);

      // Then
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('isPublic');
    });

    it('팝업이 없을 때 빈 배열을 반환해야 한다', async () => {
      // When
      const response = await request(app.getHttpServer())
        .get('/announcement-popups')
        .expect(200);

      // Then
      expect(response.body).toEqual([]);
    });

    it('manager 정보가 포함되어야 한다', async () => {
      // Given
      await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      const response = await request(app.getHttpServer())
        .get('/announcement-popups')
        .expect(200);

      // Then
      expect(response.body[0]).toHaveProperty('manager');
      expect(response.body[0].manager).toHaveProperty('id');
      expect(response.body[0].manager).toHaveProperty('name');
    });

    it('생성일 기준 내림차순으로 정렬되어야 한다', async () => {
      // Given: 3개의 팝업을 순차적으로 생성
      const manager = await testDataBuilder.직원을_생성한다();

      const popup1 = await testDataBuilder.공지사항_팝업을_생성한다({
        title: '첫 번째 팝업',
        manager,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      const popup2 = await testDataBuilder.공지사항_팝업을_생성한다({
        title: '두 번째 팝업',
        manager,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      const popup3 = await testDataBuilder.공지사항_팝업을_생성한다({
        title: '세 번째 팝업',
        manager,
      });

      // When
      const response = await request(app.getHttpServer())
        .get('/announcement-popups')
        .expect(200);

      // Then
      expect(response.body).toHaveLength(3);
      expect(response.body[0].title).toBe('세 번째 팝업');
      expect(response.body[1].title).toBe('두 번째 팝업');
      expect(response.body[2].title).toBe('첫 번째 팝업');
    });

    it('category와 language 정보가 포함되어야 한다', async () => {
      // Given
      await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      const response = await request(app.getHttpServer())
        .get('/announcement-popups')
        .expect(200);

      // Then
      expect(response.body[0]).toHaveProperty('category');
      expect(response.body[0].category).toHaveProperty('id');
      expect(response.body[0].category).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('language');
      expect(response.body[0].language).toHaveProperty('code');
    });

    it('tags 정보가 배열로 포함되어야 한다', async () => {
      // Given
      await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      const response = await request(app.getHttpServer())
        .get('/announcement-popups')
        .expect(200);

      // Then
      expect(response.body[0]).toHaveProperty('tags');
      expect(response.body[0].tags).toBeInstanceOf(Array);
    });

    it('attachments 정보가 배열로 포함되어야 한다', async () => {
      // Given
      await testDataBuilder.공지사항_팝업을_생성한다({
        attachments: ['https://s3.amazonaws.com/file1.pdf'],
      });

      // When
      const response = await request(app.getHttpServer())
        .get('/announcement-popups')
        .expect(200);

      // Then
      expect(response.body[0]).toHaveProperty('attachments');
      expect(response.body[0].attachments).toBeInstanceOf(Array);
      expect(response.body[0].attachments).toHaveLength(1);
    });
  });

  describe('에러 케이스', () => {
    it('잘못된 경로로 요청 시 404를 반환해야 한다', async () => {
      // When
      await request(app.getHttpServer())
        .get('/announcement-popups-wrong')
        .expect(404);
    });
  });

  describe('응답 구조 검증', () => {
    it('각 팝업이 필수 필드를 포함해야 한다', async () => {
      // Given
      await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      const response = await request(app.getHttpServer())
        .get('/announcement-popups')
        .expect(200);

      // Then
      const popup = response.body[0];
      expect(popup).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        status: expect.any(String),
        isPublic: expect.any(Boolean),
        category: expect.any(Object),
        language: expect.any(Object),
        tags: expect.any(Array),
        manager: expect.any(Object),
        attachments: expect.any(Array),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('날짜 필드가 ISO 8601 형식이어야 한다', async () => {
      // Given
      await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      const response = await request(app.getHttpServer())
        .get('/announcement-popups')
        .expect(200);

      // Then
      const popup = response.body[0];
      expect(() => new Date(popup.createdAt)).not.toThrow();
      expect(() => new Date(popup.updatedAt)).not.toThrow();
    });
  });

  describe('대용량 데이터', () => {
    it('100개의 팝업을 정상적으로 조회해야 한다', async () => {
      // Given
      await testDataBuilder.여러_공지사항_팝업을_생성한다(100);

      // When
      const response = await request(app.getHttpServer())
        .get('/announcement-popups')
        .expect(200);

      // Then
      expect(response.body).toHaveLength(100);
    }, 30000); // 타임아웃 30초
  });
});
