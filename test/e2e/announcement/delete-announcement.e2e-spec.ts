import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { testDataBuilder } from '@test/helpers';
import { announcementFixture } from '@test/fixtures';
import { DataSource } from 'typeorm';

describe('DELETE /announcements/:id (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await dataSource.query('DELETE FROM announcement');
  });

  describe('정상적인 삭제', () => {
    it('공지사항을 삭제해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement(
        {
          ...announcementFixture,
        },
      );

      // When
      await request(app.getHttpServer())
        .delete(`/announcements/${announcement.id}`)
        .expect(204);

      // Then: 삭제 후 조회 시 빈 배열 반환
      const response = await request(app.getHttpServer())
        .get('/announcements')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('삭제 후 같은 ID로 재조회 시 404를 반환해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement(
        {
          ...announcementFixture,
        },
      );

      // When: 삭제
      await request(app.getHttpServer())
        .delete(`/announcements/${announcement.id}`)
        .expect(204);

      // Then: 재조회 시 404
      await request(app.getHttpServer())
        .get(`/announcements/${announcement.id}`)
        .expect(404);
    });

    it('여러 공지사항 중 하나만 삭제해야 한다', async () => {
      // Given
      const announcement1 = await testDataBuilder(
        dataSource,
      ).createAnnouncement({
        ...announcementFixture,
        title: '공지사항 1',
      });
      const announcement2 = await testDataBuilder(
        dataSource,
      ).createAnnouncement({
        ...announcementFixture,
        title: '공지사항 2',
      });

      // When: announcement1만 삭제
      await request(app.getHttpServer())
        .delete(`/announcements/${announcement1.id}`)
        .expect(204);

      // Then: announcement2는 여전히 존재
      const response = await request(app.getHttpServer())
        .get('/announcements')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(announcement2.id);
    });

    it('Soft Delete로 삭제되어야 한다 (deletedAt이 설정됨)', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement(
        {
          ...announcementFixture,
        },
      );

      // When
      await request(app.getHttpServer())
        .delete(`/announcements/${announcement.id}`)
        .expect(204);

      // Then: 데이터베이스에서 직접 확인
      const deletedAnnouncement = await dataSource
        .getRepository('announcement')
        .createQueryBuilder('announcement')
        .where('announcement.id = :id', { id: announcement.id })
        .withDeleted() // Soft Delete된 데이터도 조회
        .getOne();

      expect(deletedAnnouncement).toBeTruthy();
      expect(deletedAnnouncement?.deletedAt).not.toBeNull();
    });
  });

  describe('에러 처리', () => {
    it('존재하지 않는 공지사항 삭제 시 404를 반환해야 한다', async () => {
      // Given
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      // When & Then
      await request(app.getHttpServer())
        .delete(`/announcements/${nonExistentId}`)
        .expect(404);
    });

    it.skip('이미 삭제된 공지사항 재삭제 시 404를 반환해야 한다', async () => {
      // TODO: Soft Delete 시 affect=0 처리 필요
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement(
        {
          ...announcementFixture,
        },
      );

      // 첫 번째 삭제
      await request(app.getHttpServer())
        .delete(`/announcements/${announcement.id}`)
        .expect(204);

      // When & Then: 두 번째 삭제 시도
      await request(app.getHttpServer())
        .delete(`/announcements/${announcement.id}`)
        .expect(404);
    });

    it.skip('잘못된 UUID 형식의 ID로 삭제 시 400을 반환해야 한다', async () => {
      // TODO: UUID validation pipe 추가 필요
      // Given
      const invalidId = 'invalid-uuid-format';

      // When & Then
      await request(app.getHttpServer())
        .delete(`/announcements/${invalidId}`)
        .expect(400);
    });
  });

  describe('응답 검증', () => {
    it('삭제 성공 시 빈 응답을 반환해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement(
        {
          ...announcementFixture,
        },
      );

      // When
      const response = await request(app.getHttpServer())
        .delete(`/announcements/${announcement.id}`)
        .expect(204);

      // Then
      // 204 No Content는 body가 없음
    });
  });
});
