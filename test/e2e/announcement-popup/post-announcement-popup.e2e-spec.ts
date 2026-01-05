import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestSuiteHelper, TestDataBuilder } from '../../helpers';

describe('POST /announcement-popups (E2E)', () => {
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
    it('유효한 데이터로 공지사항 팝업을 생성해야 한다', async () => {
      // Given
      const manager = await testDataBuilder.직원을_생성한다();
      const createDto = {
        title: '새로운 팝업',
        status: 'draft',
        isPublic: false,
        category: {
          id: 'category-001',
          name: '일반 공지',
          description: '일반적인 공지사항',
        },
        language: { code: 'ko', label: '한국어', name: 'korean' },
        managerId: manager.id,
        tags: [{ id: 'tag-001', name: '긴급', description: '긴급 공지' }],
        attachments: [],
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: createDto.title,
        status: createDto.status,
        isPublic: createDto.isPublic,
      });
      expect(response.body.manager).toBeDefined();
      expect(response.body.manager.id).toBe(manager.id);
    });

    it('최소한의 필수 데이터로 생성할 수 있어야 한다', async () => {
      // Given
      const manager = await testDataBuilder.직원을_생성한다();
      const createDto = {
        title: '필수 제목만',
        category: {
          id: 'category-001',
          name: '일반 공지',
          description: '일반적인 공지사항',
        },
        language: { code: 'ko', label: '한국어', name: 'korean' },
        managerId: manager.id,
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.title).toBe(createDto.title);
      expect(response.body.id).toBeDefined();
    });

    it('첨부파일이 있는 팝업을 생성할 수 있어야 한다', async () => {
      // Given
      const manager = await testDataBuilder.직원을_생성한다();
      const createDto = {
        title: '첨부파일 포함 팝업',
        category: {
          id: 'category-001',
          name: '일반 공지',
          description: '일반적인 공지사항',
        },
        language: { code: 'ko', label: '한국어', name: 'korean' },
        managerId: manager.id,
        attachments: [
          'https://s3.amazonaws.com/file1.pdf',
          'https://s3.amazonaws.com/file2.pdf',
        ],
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.attachments).toHaveLength(2);
      expect(response.body.attachments).toContain(
        'https://s3.amazonaws.com/file1.pdf',
      );
    });

    it('공개 상태로 팝업을 생성할 수 있어야 한다', async () => {
      // Given
      const manager = await testDataBuilder.직원을_생성한다();
      const createDto = {
        title: '공개 팝업',
        category: {
          id: 'category-001',
          name: '일반 공지',
          description: '일반적인 공지사항',
        },
        language: { code: 'ko', label: '한국어', name: 'korean' },
        managerId: manager.id,
        isPublic: true,
        status: 'opened',
        releasedAt: new Date().toISOString(),
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.isPublic).toBe(true);
      expect(response.body.status).toBe('opened');
      expect(response.body.releasedAt).toBeDefined();
    });

    it('여러 태그를 포함한 팝업을 생성할 수 있어야 한다', async () => {
      // Given
      const manager = await testDataBuilder.직원을_생성한다();
      const createDto = {
        title: '태그 포함 팝업',
        category: {
          id: 'category-001',
          name: '일반 공지',
          description: '일반적인 공지사항',
        },
        language: { code: 'ko', label: '한국어', name: 'korean' },
        managerId: manager.id,
        tags: [
          { id: 'tag-001', name: '긴급', description: '긴급 공지' },
          { id: 'tag-002', name: '중요', description: '중요 공지' },
        ],
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(201);

      // Then
      console.log('Response body:', JSON.stringify(response.body, null, 2));
      console.log('Tags:', response.body.tags);
      expect(response.body.tags).toHaveLength(2);
      expect(response.body.tags[0].name).toBe('긴급');
    });
  });

  describe('실패 케이스', () => {
    it('필수 필드 누락 시 400을 반환해야 한다', async () => {
      // Given
      const createDto = {
        // title 누락
        status: 'draft',
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(400);
    });

    it('잘못된 데이터 타입으로 요청 시 400을 반환해야 한다', async () => {
      // Given
      const createDto = {
        title: 123, // 문자열이어야 함
        isPublic: 'true', // 불리언이어야 함
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(400);
    });

    it('빈 제목으로 요청 시 400을 반환해야 한다', async () => {
      // Given
      const createDto = {
        title: '',
        managerId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(400);
    });

    it('존재하지 않는 managerId로 요청 시 적절한 에러를 반환해야 한다', async () => {
      // Given
      const createDto = {
        title: '테스트 팝업',
        managerId: '550e8400-e29b-41d4-a716-446655440999', // 존재하지 않는 ID
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('잘못된 UUID 형식의 managerId로 요청 시 400을 반환해야 한다', async () => {
      // Given
      const createDto = {
        title: '테스트 팝업',
        managerId: 'invalid-uuid',
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(400);
    });

    it('Content-Type이 없는 경우 적절한 에러를 반환해야 한다', async () => {
      // When & Then
      const response = await request(app.getHttpServer())
        .post('/announcement-popups')
        .set('Content-Type', '')
        .send('invalid data');

      expect([400, 415]).toContain(response.status);
    });

    it('잘못된 JSON 형식으로 요청 시 400을 반환해야 한다', async () => {
      // When & Then
      await request(app.getHttpServer())
        .post('/announcement-popups')
        .set('Content-Type', 'application/json')
        .send('{invalid json}')
        .expect(400);
    });
  });

  describe('경계값 테스트', () => {
    it('매우 긴 제목으로 팝업을 생성할 수 있어야 한다', async () => {
      // Given
      const manager = await testDataBuilder.직원을_생성한다();
      const longTitle = 'A'.repeat(500); // 최대 길이
      const createDto = {
        title: longTitle,
        category: {
          id: 'category-001',
          name: '일반 공지',
          description: '일반적인 공지사항',
        },
        language: { code: 'ko', label: '한국어', name: 'korean' },
        managerId: manager.id,
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.title).toBe(longTitle);
    });

    it('제목이 최대 길이를 초과하면 400을 반환해야 한다', async () => {
      // Given
      const manager = await testDataBuilder.직원을_생성한다();
      const tooLongTitle = 'A'.repeat(501); // 최대 길이 초과
      const createDto = {
        title: tooLongTitle,
        managerId: manager.id,
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(400);
    });

    it('빈 attachments 배열로 팝업을 생성할 수 있어야 한다', async () => {
      // Given
      const manager = await testDataBuilder.직원을_생성한다();
      const createDto = {
        title: '첨부파일 없는 팝업',
        category: {
          id: 'category-001',
          name: '일반 공지',
          description: '일반적인 공지사항',
        },
        language: { code: 'ko', label: '한국어', name: 'korean' },
        managerId: manager.id,
        attachments: [],
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.attachments).toEqual([]);
    });
  });

  describe('응답 구조 검증', () => {
    it('생성된 팝업이 필수 필드를 포함해야 한다', async () => {
      // Given
      const manager = await testDataBuilder.직원을_생성한다();
      const createDto = {
        title: '새 팝업',
        category: {
          id: 'category-001',
          name: '일반 공지',
          description: '일반적인 공지사항',
        },
        language: { code: 'ko', label: '한국어', name: 'korean' },
        managerId: manager.id,
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        version: expect.any(Number),
      });
    });

    it('생성 후 조회 가능해야 한다', async () => {
      // Given
      const manager = await testDataBuilder.직원을_생성한다();
      const createDto = {
        title: '생성 후 조회 테스트',
        category: {
          id: 'category-001',
          name: '일반 공지',
          description: '일반적인 공지사항',
        },
        language: { code: 'ko', label: '한국어', name: 'korean' },
        managerId: manager.id,
      };

      // When
      const createResponse = await request(app.getHttpServer())
        .post('/announcement-popups')
        .send(createDto)
        .expect(201);

      const getResponse = await request(app.getHttpServer())
        .get(`/announcement-popups/${createResponse.body.id}`)
        .expect(200);

      // Then
      expect(getResponse.body.id).toBe(createResponse.body.id);
      expect(getResponse.body.title).toBe(createDto.title);
    });
  });
});
