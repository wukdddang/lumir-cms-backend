import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestSuiteHelper, TestDataBuilder } from '../../helpers';

describe('PATCH /announcement-popups/:id (E2E)', () => {
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
    it('공지사항 팝업을 부분 수정해야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      const updateDto = {
        title: '수정된 제목',
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.title).toBe(updateDto.title);
      expect(response.body.id).toBe(popup.id);
    });

    it('여러 필드를 동시에 수정할 수 있어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      const updateDto = {
        title: '수정된 제목',
        status: 'approved',
        isPublic: true,
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.title).toBe(updateDto.title);
      expect(response.body.status).toBe(updateDto.status);
      expect(response.body.isPublic).toBe(updateDto.isPublic);
    });

    it('첨부파일을 추가할 수 있어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다({
        attachments: [],
      });
      const updateDto = {
        attachments: ['https://s3.amazonaws.com/new-file.pdf'],
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.attachments).toHaveLength(1);
      expect(response.body.attachments[0]).toBe(
        'https://s3.amazonaws.com/new-file.pdf',
      );
    });

    it('첨부파일을 제거할 수 있어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다({
        attachments: ['https://s3.amazonaws.com/old-file.pdf'],
      });
      const updateDto = {
        attachments: [],
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.attachments).toEqual([]);
    });

    it('태그를 수정할 수 있어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      const updateDto = {
        tags: [{ id: 'tag-003', name: '신규', description: '신규 태그' }],
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.tags).toHaveLength(1);
      expect(response.body.tags[0].name).toBe('신규');
    });

    it('수정 후 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      const originalUpdatedAt = popup.updatedAt;
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send({ title: '수정' })
        .expect(200);

      // Then
      const newUpdatedAt = new Date(response.body.updatedAt);
      expect(newUpdatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 수정 시 404를 반환해야 한다', async () => {
      // Given
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      const updateDto = {
        title: '수정',
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/announcement-popups/${nonExistentId}`)
        .send(updateDto)
        .expect(404);
    });

    it('잘못된 UUID 형식으로 수정 시 400을 반환해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid';
      const updateDto = {
        title: '수정',
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/announcement-popups/${invalidId}`)
        .send(updateDto)
        .expect(400);
    });

    it('잘못된 데이터 타입으로 수정 시 400을 반환해야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      const updateDto = {
        isPublic: 'not-a-boolean',
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send(updateDto)
        .expect(400);
    });

    it('빈 제목으로 수정 시 400을 반환해야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      const updateDto = {
        title: '',
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send(updateDto)
        .expect(400);
    });

    it('잘못된 status 값으로 수정 시 400을 반환해야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      const updateDto = {
        status: 'invalid-status',
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send(updateDto)
        .expect(400);
    });
  });

  describe('경계값 테스트', () => {
    it('최대 길이의 제목으로 수정할 수 있어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      const longTitle = 'A'.repeat(500);
      const updateDto = {
        title: longTitle,
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.title).toBe(longTitle);
    });

    it('제목이 최대 길이를 초과하면 400을 반환해야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      const tooLongTitle = 'A'.repeat(501);
      const updateDto = {
        title: tooLongTitle,
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send(updateDto)
        .expect(400);
    });
  });

  describe('응답 구조 검증', () => {
    it('수정된 팝업이 필수 필드를 포함해야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      const updateDto = {
        title: '수정된 제목',
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        status: expect.any(String),
        isPublic: expect.any(Boolean),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        version: expect.any(Number),
      });
    });

    it('수정되지 않은 필드는 유지되어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      const originalStatus = popup.status;
      const updateDto = {
        title: '제목만 수정',
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcement-popups/${popup.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.status).toBe(originalStatus);
    });
  });
});
