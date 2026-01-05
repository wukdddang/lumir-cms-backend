import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestSuiteHelper, TestDataBuilder } from '../../helpers';
import { ContentStatus } from '@domain/core/common/types/status.types';

describe('DELETE /announcement-popups/:id (E2E)', () => {
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
    it('공지사항 팝업을 소프트 삭제해야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      await request(app.getHttpServer())
        .delete(`/announcement-popups/${popup.id}`)
        .expect(204);

      // Then
      // 조회 시 404 반환
      await request(app.getHttpServer())
        .get(`/announcement-popups/${popup.id}`)
        .expect(404);
    });

    it('삭제 후 목록 조회 시 제외되어야 한다', async () => {
      // Given
      const popup1 = await testDataBuilder.공지사항_팝업을_생성한다({
        title: '팝업 1',
      });
      const popup2 = await testDataBuilder.공지사항_팝업을_생성한다({
        title: '팝업 2',
      });

      // When
      await request(app.getHttpServer())
        .delete(`/announcement-popups/${popup1.id}`)
        .expect(204);

      // Then
      const response = await request(app.getHttpServer())
        .get('/announcement-popups')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(popup2.id);
    });

    it('여러 팝업을 순차적으로 삭제할 수 있어야 한다', async () => {
      // Given
      const popups = await testDataBuilder.여러_공지사항_팝업을_생성한다(3);

      // When
      for (const popup of popups) {
        await request(app.getHttpServer())
          .delete(`/announcement-popups/${popup.id}`)
          .expect(204);
      }

      // Then
      const response = await request(app.getHttpServer())
        .get('/announcement-popups')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('첨부파일이 있는 팝업을 삭제할 수 있어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다({
        attachments: ['https://s3.amazonaws.com/file.pdf'],
      });

      // When & Then
      await request(app.getHttpServer())
        .delete(`/announcement-popups/${popup.id}`)
        .expect(204);
    });

    it('공개된 팝업을 삭제할 수 있어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다({
        isPublic: true,
        status: ContentStatus.OPENED,
        releasedAt: new Date(),
      });

      // When & Then
      await request(app.getHttpServer())
        .delete(`/announcement-popups/${popup.id}`)
        .expect(204);
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 삭제 시 404를 반환해야 한다', async () => {
      // Given
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';

      // When & Then
      await request(app.getHttpServer())
        .delete(`/announcement-popups/${nonExistentId}`)
        .expect(404);
    });

    it('잘못된 UUID 형식으로 삭제 시 400을 반환해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid';

      // When & Then
      await request(app.getHttpServer())
        .delete(`/announcement-popups/${invalidId}`)
        .expect(400);
    });

    it('이미 삭제된 팝업을 다시 삭제 시 404를 반환해야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      await request(app.getHttpServer())
        .delete(`/announcement-popups/${popup.id}`)
        .expect(204);

      // When & Then
      await request(app.getHttpServer())
        .delete(`/announcement-popups/${popup.id}`)
        .expect(404);
    });
  });

  describe('데이터 무결성', () => {
    it('삭제 후 데이터베이스에서 실제로 제거되지 않아야 한다 (Soft Delete)', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      await request(app.getHttpServer())
        .delete(`/announcement-popups/${popup.id}`)
        .expect(204);

      // Then
      // 데이터베이스에 직접 쿼리 (withDeleted 옵션 사용)
      const dataSource = testSuite.getDataSource();
      const repository = dataSource.getRepository('AnnouncementPopup');
      const deletedPopup = await repository
        .createQueryBuilder('popup')
        .withDeleted()
        .where('popup.id = :id', { id: popup.id })
        .getOne();

      expect(deletedPopup).toBeDefined();
      expect(deletedPopup).not.toBeNull();
      expect(deletedPopup!.deletedAt).toBeDefined();
    });

    it('삭제된 팝업의 관계 데이터는 유지되어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();
      const managerId = popup.manager.id;

      // When
      await request(app.getHttpServer())
        .delete(`/announcement-popups/${popup.id}`)
        .expect(204);

      // Then
      // Manager는 삭제되지 않아야 함
      const dataSource = testSuite.getDataSource();
      const employeeRepository = dataSource.getRepository('Employee');
      const manager = await employeeRepository.findOne({
        where: { id: managerId },
      });

      expect(manager).toBeDefined();
    });
  });

  describe('동시성 테스트', () => {
    it('동시에 같은 팝업을 삭제하면 하나만 성공해야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      const results = await Promise.allSettled([
        request(app.getHttpServer()).delete(`/announcement-popups/${popup.id}`),
        request(app.getHttpServer()).delete(`/announcement-popups/${popup.id}`),
      ]);

      // Then
      const statuses = results.map((r) =>
        r.status === 'fulfilled' ? r.value.status : 0,
      );
      const successCount = statuses.filter(
        (s) => s === 204 || s === 200,
      ).length;
      const notFoundCount = statuses.filter((s) => s === 404).length;

      expect(successCount).toBe(1);
      expect(notFoundCount).toBe(1);
    });
  });

  describe('응답 구조 검증', () => {
    it('성공 시 응답 본문이 없어야 한다', async () => {
      // Given
      const popup = await testDataBuilder.공지사항_팝업을_생성한다();

      // When
      const response = await request(app.getHttpServer())
        .delete(`/announcement-popups/${popup.id}`)
        .expect(204);

      // Then
      expect(response.body).toEqual({});
    });
  });
});
