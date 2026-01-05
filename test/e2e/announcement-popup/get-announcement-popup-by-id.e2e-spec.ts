import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestSuiteHelper, TestDataBuilder } from '../../helpers';
import { ContentStatus } from '@domain/core/common/types/status.types';

describe('GET /announcement-popups/:id (E2E)', () => {
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
    it('ID로 공지사항 팝업을 조회해야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      const response = await request(app.getHttpServer())
        .get(`/announcement-popups/${popup.id}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: popup.id,
        title: popup.title,
        status: popup.status,
        isPublic: popup.isPublic,
      });
    });

    it('manager 정보가 포함되어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      const response = await request(app.getHttpServer())
        .get(`/announcement-popups/${popup.id}`)
        .expect(200);

      // Then
      expect(response.body.manager).toBeDefined();
      expect(response.body.manager.id).toBe(popup.manager.id);
      expect(response.body.manager.name).toBe(popup.manager.name);
    });

    it('category, language, tags 정보가 포함되어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      const response = await request(app.getHttpServer())
        .get(`/announcement-popups/${popup.id}`)
        .expect(200);

      // Then
      expect(response.body.category).toBeDefined();
      expect(response.body.language).toBeDefined();
      expect(response.body.tags).toBeInstanceOf(Array);
    });

    it('첨부파일이 있는 팝업을 조회할 수 있어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다({
        attachments: [
          'https://s3.amazonaws.com/file1.pdf',
          'https://s3.amazonaws.com/file2.pdf',
        ],
      });

      // When
      const response = await request(app.getHttpServer())
        .get(`/announcement-popups/${popup.id}`)
        .expect(200);

      // Then
      expect(response.body.attachments).toHaveLength(2);
      expect(response.body.attachments[0]).toBe(
        'https://s3.amazonaws.com/file1.pdf',
      );
    });

    it('공개된 팝업을 조회할 수 있어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다({
        isPublic: true,
        status: ContentStatus.OPENED,
        releasedAt: new Date(),
      });

      // When
      const response = await request(app.getHttpServer())
        .get(`/announcement-popups/${popup.id}`)
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(true);
      expect(response.body.status).toBe('opened');
      expect(response.body.releasedAt).toBeDefined();
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 조회 시 404를 반환해야 한다', async () => {
      // Given
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';

      // When & Then
      await request(app.getHttpServer())
        .get(`/announcement-popups/${nonExistentId}`)
        .expect(404);
    });

    it('잘못된 UUID 형식으로 조회 시 400을 반환해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid';

      // When & Then
      await request(app.getHttpServer())
        .get(`/announcement-popups/${invalidId}`)
        .expect(400);
    });

    it('빈 문자열 ID로 조회 시 400을 반환해야 한다', async () => {
      // Given
      const emptyId = '';

      // When & Then
      // 빈 문자열 UUID는 잘못된 형식이므로 400 반환
      await request(app.getHttpServer())
        .get(`/announcement-popups/${emptyId}`)
        .expect(400);
    });
  });

  describe('응답 구조 검증', () => {
    it('응답이 필수 필드를 모두 포함해야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      const response = await request(app.getHttpServer())
        .get(`/announcement-popups/${popup.id}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
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
        version: expect.any(Number),
      });
    });

    it('날짜 필드가 ISO 8601 형식이어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      const response = await request(app.getHttpServer())
        .get(`/announcement-popups/${popup.id}`)
        .expect(200);

      // Then
      expect(() => new Date(response.body.createdAt)).not.toThrow();
      expect(() => new Date(response.body.updatedAt)).not.toThrow();
    });
  });
});
