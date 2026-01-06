import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { testDataBuilder } from '@test/helpers';
import { createAnnouncementDtoFixture } from '@test/fixtures';
import { DataSource } from 'typeorm';

describe('POST /announcements (E2E)', () => {
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

  describe('정상적인 생성', () => {
    it('유효한 데이터로 공지사항을 생성해야 한다', async () => {
      // Given
      const manager = await testDataBuilder(dataSource).직원을_생성한다();
      const dto = {
        ...createAnnouncementDtoFixture,
        managerId: manager.id,
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/announcements')
        .send(dto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: dto.title,
        content: dto.content,
        isFixed: dto.isFixed,
        mustRead: dto.mustRead,
      });
    });

    it('필수 필드만으로 공지사항을 생성해야 한다', async () => {
      // Given
      const manager = await testDataBuilder(dataSource).직원을_생성한다();
      const dto = {
        title: '필수 필드만 있는 공지사항',
        content: '최소한의 정보만 포함',
        isFixed: false,
        category: { id: 'cat-001', name: '일반', description: '일반 공지사항' },
        mustRead: false,
        managerId: manager.id,
        employeeIds: [],
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/announcements')
        .send(dto)
        .expect(201);

      // Then
      expect(response.body.title).toBe(dto.title);
      expect(response.body.content).toBe(dto.content);
    });
  });

  describe('데이터 검증', () => {
    it('제목 없이 생성 시 400을 반환해야 한다', async () => {
      // Given
      const manager = await testDataBuilder(dataSource).직원을_생성한다();
      const dto = {
        ...createAnnouncementDtoFixture,
        managerId: manager.id,
        title: undefined,
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/announcements')
        .send(dto)
        .expect(400);
    });

    it('내용 없이 생성 시 400을 반환해야 한다', async () => {
      // Given
      const manager = await testDataBuilder(dataSource).직원을_생성한다();
      const dto = {
        ...createAnnouncementDtoFixture,
        managerId: manager.id,
        content: undefined,
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/announcements')
        .send(dto)
        .expect(400);
    });

    it('빈 제목으로 생성 시 400을 반환해야 한다', async () => {
      // Given
      const manager = await testDataBuilder(dataSource).직원을_생성한다();
      const dto = {
        ...createAnnouncementDtoFixture,
        managerId: manager.id,
        title: '',
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/announcements')
        .send(dto)
        .expect(400);
    });

    it('제목이 500자를 초과하면 400을 반환해야 한다', async () => {
      // Given
      const manager = await testDataBuilder(dataSource).직원을_생성한다();
      const dto = {
        ...createAnnouncementDtoFixture,
        managerId: manager.id,
        title: 'a'.repeat(501),
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/announcements')
        .send(dto)
        .expect(400);
    });

    it('잘못된 데이터 타입으로 생성 시 400을 반환해야 한다', async () => {
      // Given
      const manager = await testDataBuilder(dataSource).직원을_생성한다();
      const dto = {
        ...createAnnouncementDtoFixture,
        managerId: manager.id,
        isFixed: 'invalid-boolean', // boolean이어야 함
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/announcements')
        .send(dto)
        .expect(400);
    });
  });

  describe('응답 구조 검증', () => {
    it('생성된 공지사항이 필수 필드를 포함해야 한다', async () => {
      // Given
      const manager = await testDataBuilder(dataSource).직원을_생성한다();
      const dto = {
        ...createAnnouncementDtoFixture,
        managerId: manager.id,
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/announcements')
        .send(dto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        title: dto.title,
        content: dto.content,
        isFixed: dto.isFixed,
        category: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
        }),
        mustRead: dto.mustRead,
        hits: expect.any(Number),
      });
    });
  });
});
