import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { testDataBuilder } from '@test/helpers';
import { announcementFixture } from '@test/fixtures';
import { DataSource } from 'typeorm';

describe('PATCH /announcements/:id (E2E)', () => {
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

  describe('정상적인 수정', () => {
    it('공지사항 제목을 수정해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      const updateDto = {
        title: '수정된 제목',
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcements/${announcement.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.title).toBe(updateDto.title);
      expect(response.body.content).toBe(announcement.content); // 다른 필드는 유지
    });

    it('공지사항 내용을 수정해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      const updateDto = {
        content: '수정된 내용입니다.',
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcements/${announcement.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.content).toBe(updateDto.content);
    });

    it('상단 고정 여부를 수정해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
        isFixed: false,
      });

      const updateDto = {
        isFixed: true,
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcements/${announcement.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.isFixed).toBe(true);
    });

    it('여러 필드를 동시에 수정해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      const updateDto = {
        title: '새 제목',
        content: '새 내용',
        isFixed: true,
        mustRead: true,
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcements/${announcement.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject(updateDto);
    });
  });

  describe('에러 처리', () => {
    it('존재하지 않는 공지사항 수정 시 404를 반환해야 한다', async () => {
      // Given
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      const updateDto = {
        title: '수정된 제목',
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/announcements/${nonExistentId}`)
        .send(updateDto)
        .expect(404);
    });

    it('빈 제목으로 수정 시 400을 반환해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      const updateDto = {
        title: '',
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/announcements/${announcement.id}`)
        .send(updateDto)
        .expect(400);
    });

    it('제목이 500자를 초과하면 400을 반환해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      const updateDto = {
        title: 'a'.repeat(501),
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/announcements/${announcement.id}`)
        .send(updateDto)
        .expect(400);
    });

    it('잘못된 데이터 타입으로 수정 시 400을 반환해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      const updateDto = {
        isFixed: 'invalid-boolean',
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/announcements/${announcement.id}`)
        .send(updateDto)
        .expect(400);
    });
  });

  describe('응답 구조 검증', () => {
    it('수정된 공지사항이 필수 필드를 포함해야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      const updateDto = {
        title: '수정된 제목',
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcements/${announcement.id}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: announcement.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        title: updateDto.title,
        content: expect.any(String),
        isFixed: expect.any(Boolean),
        mustRead: expect.any(Boolean),
      });
    });

    it('updatedAt이 갱신되어야 한다', async () => {
      // Given
      const announcement = await testDataBuilder(dataSource).createAnnouncement({
        ...announcementFixture,
      });

      const originalUpdatedAt = new Date(announcement.updatedAt);

      // 약간의 시간 지연
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When
      const response = await request(app.getHttpServer())
        .patch(`/announcements/${announcement.id}`)
        .send({ title: '수정된 제목' })
        .expect(200);

      // Then
      const newUpdatedAt = new Date(response.body.updatedAt);
      expect(newUpdatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
