import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { testDataBuilder } from '@test/helpers';
import { announcementFixture, anotherAnnouncementFixture } from '@test/fixtures';
import { DataSource } from 'typeorm';

describe('GET /announcements (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // ValidationPipe 설정
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
    // 각 테스트 후 데이터 정리
    await dataSource.query('DELETE FROM announcement');
  });

  describe('정상적인 조회', () => {
    it('공지사항이 없을 때 빈 배열을 반환해야 한다', async () => {
      // When
      const response = await request(app.getHttpServer())
        .get('/announcements')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('모든 공지사항을 조회해야 한다', async () => {
      // Given: 공지사항 2개 생성
      const announcement1 = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });
      const announcement2 = await testDataBuilder(dataSource).createAnnouncement({
        ...anotherAnnouncementFixture,
      });

      // When
      const response = await request(app.getHttpServer())
        .get('/announcements')
        .expect(200);

      // Then
      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: announcement1.id,
            title: announcement1.title,
          }),
          expect.objectContaining({
            id: announcement2.id,
            title: announcement2.title,
          }),
        ]),
      );
    });

    it('공지사항이 최신순으로 정렬되어야 한다', async () => {
      // Given: 공지사항 3개를 시간 차이를 두고 생성
      const announcement1 = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
        title: '첫 번째 공지사항',
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const announcement2 = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
        title: '두 번째 공지사항',
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const announcement3 = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
        title: '세 번째 공지사항',
      });

      // When
      const response = await request(app.getHttpServer())
        .get('/announcements')
        .expect(200);

      // Then
      expect(response.body).toHaveLength(3);
      expect(response.body[0].id).toBe(announcement3.id); // 가장 최근
      expect(response.body[1].id).toBe(announcement2.id);
      expect(response.body[2].id).toBe(announcement1.id); // 가장 오래된
    });

    it('고정 공지사항이 먼저 나와야 한다', async () => {
      // Given
      const normalAnnouncement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
        title: '일반 공지사항',
        isFixed: false,
      });

      const fixedAnnouncement = await testDataBuilder(dataSource).createAnnouncement({
        ...anotherAnnouncementFixture,
        title: '고정 공지사항',
        isFixed: true,
      });

      // When
      const response = await request(app.getHttpServer())
        .get('/announcements')
        .expect(200);

      // Then
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe(fixedAnnouncement.id); // 고정이 먼저
      expect(response.body[1].id).toBe(normalAnnouncement.id);
    });
  });

  describe('응답 구조 검증', () => {
    it('각 공지사항이 필수 필드를 포함해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      // When
      const response = await request(app.getHttpServer())
        .get('/announcements')
        .expect(200);

      // Then
      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        title: announcement.title,
        content: announcement.content,
        isFixed: announcement.isFixed,
        category: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
        }),
        mustRead: announcement.mustRead,
        status: announcement.status,
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
        .get('/announcements')
        .expect(200);

      // Then
      expect(response.body[0].manager).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
      });
    });
  });
});
