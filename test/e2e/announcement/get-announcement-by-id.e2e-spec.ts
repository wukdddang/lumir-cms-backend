import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { testDataBuilder } from '@test/helpers';
import { announcementFixture } from '@test/fixtures';
import { DataSource } from 'typeorm';

describe('GET /announcements/:id (E2E)', () => {
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

  describe('정상적인 조회', () => {
    it('ID로 공지사항을 조회해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      // When
      const response = await request(app.getHttpServer())
        .get(`/announcements/${announcement.id}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
      });
    });

    it('조회 시 조회수가 증가해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      const initialHits = announcement.hits;

      // When
      const response = await request(app.getHttpServer())
        .get(`/announcements/${announcement.id}`)
        .expect(200);

      // Then
      expect(response.body.hits).toBe(initialHits + 1);
    });
  });

  describe('에러 처리', () => {
    it('존재하지 않는 ID로 조회 시 404를 반환해야 한다', async () => {
      // Given
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      // When & Then
      await request(app.getHttpServer())
        .get(`/announcements/${nonExistentId}`)
        .expect(404);
    });

    it('잘못된 UUID 형식의 ID로 조회 시 400을 반환해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid-format';

      // When & Then
      await request(app.getHttpServer())
        .get(`/announcements/${invalidId}`)
        .expect(400);
    });

    it('삭제된 공지사항 조회 시 404를 반환해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      // 삭제
      await request(app.getHttpServer())
        .delete(`/announcements/${announcement.id}`)
        .expect(200);

      // When & Then: 삭제된 공지사항 조회
      await request(app.getHttpServer())
        .get(`/announcements/${announcement.id}`)
        .expect(404);
    });
  });

  describe('응답 구조 검증', () => {
    it('공지사항이 필수 필드를 포함해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      // When
      const response = await request(app.getHttpServer())
        .get(`/announcements/${announcement.id}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        title: expect.any(String),
        content: expect.any(String),
        isFixed: expect.any(Boolean),
        category: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
        }),
        mustRead: expect.any(Boolean),
        status: expect.any(String),
        hits: expect.any(Number),
      });
    });

    it('관리자 정보가 포함되어야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      // When
      const response = await request(app.getHttpServer())
        .get(`/announcements/${announcement.id}`)
        .expect(200);

      // Then
      expect(response.body.manager).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
      });
    });

    it('직원 응답 정보가 포함되어야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      // When
      const response = await request(app.getHttpServer())
        .get(`/announcements/${announcement.id}`)
        .expect(200);

      // Then
      expect(response.body.employees).toEqual(expect.any(Array));
      if (response.body.employees.length > 0) {
        expect(response.body.employees[0]).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          isRead: expect.any(Boolean),
          isSubmitted: expect.any(Boolean),
        });
      }
    });
  });
});
