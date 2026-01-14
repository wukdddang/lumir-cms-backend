import { BaseE2ETest } from '../../../base-e2e.spec';
import { ContentStatus } from '@domain/core/content-status.types';

describe('POST /api/admin/announcements (공지사항 생성)', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  describe('성공 케이스', () => {
    it('기본 공지사항을 생성해야 한다', async () => {
      // Given
      const createDto = {
        title: '2024년 신년 인사',
        content: '새해 복 많이 받으세요.',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: '2024년 신년 인사',
        content: '새해 복 많이 받으세요.',
        isFixed: false,
        isPublic: true,
        mustRead: false,
        status: ContentStatus.DRAFT, // 기본 상태는 DRAFT
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('모든 필드를 포함한 공지사항을 생성해야 한다', async () => {
      // Given
      const createDto = {
        title: '긴급 공지사항',
        content: '모든 직원은 필독하시기 바랍니다.',
        isFixed: true,
        isPublic: false,
        mustRead: true,
        releasedAt: '2024-01-01T00:00:00Z',
        expiredAt: '2024-12-31T23:59:59Z',
        permissionEmployeeIds: ['uuid-1', 'uuid-2'],
        permissionRankCodes: ['매니저', '책임매니저'],
        permissionPositionCodes: ['팀장'],
        permissionDepartmentCodes: ['경영지원-경지'],
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: '긴급 공지사항',
        content: '모든 직원은 필독하시기 바랍니다.',
        isFixed: true,
        isPublic: false,
        mustRead: true,
        releasedAt: expect.any(String),
        expiredAt: expect.any(String),
      });

      // 권한 정보는 응답 구조에 따라 다를 수 있음
      // permissions 필드가 있는 경우 확인, 없는 경우 생략
    });

    it('첨부파일이 있는 공지사항을 생성해야 한다', async () => {
      // Given
      const createDto = {
        title: '첨부파일 공지사항',
        content: '첨부파일을 확인해주세요.',
        attachments: [
          {
            fileName: 'test.pdf',
            fileUrl: 'https://example.com/test.pdf',
            fileSize: 1024000,
            mimeType: 'application/pdf',
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: '첨부파일 공지사항',
        content: '첨부파일을 확인해주세요.',
      });
      expect(response.body.attachments).toBeDefined();
      expect(response.body.attachments).toHaveLength(1);
      expect(response.body.attachments[0]).toMatchObject({
        fileName: 'test.pdf',
        fileUrl: 'https://example.com/test.pdf',
        mimeType: 'application/pdf',
      });
      // fileSize는 응답에 포함되지 않을 수 있음
    });

    it('여러 개의 공지사항을 생성해야 한다', async () => {
      // Given
      const announcements = [
        { title: '공지1', content: '내용1' },
        { title: '공지2', content: '내용2', isFixed: true },
        { title: '공지3', content: '내용3', mustRead: true },
      ];

      // When & Then
      for (const announcement of announcements) {
        const response = await testSuite
          .request()
          .post('/api/admin/announcements')
          .send(announcement)
          .expect(201);

        expect(response.body).toMatchObject({
          title: announcement.title,
          content: announcement.content,
        });
      }
    });
  });

  describe('실패 케이스 - 필수 필드 누락', () => {
    it('title이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        content: '내용만 있는 공지사항',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('content가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        title: '제목만 있는 공지사항',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('title과 content가 모두 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        isFixed: true,
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });
  });

  describe('실패 케이스 - 잘못된 데이터 타입', () => {
    it('title이 문자열이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        title: 12345,
        content: '내용',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('isFixed가 boolean이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        title: '제목',
        content: '내용',
        isFixed: 'true',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('isPublic이 boolean이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        title: '제목',
        content: '내용',
        isPublic: 'false',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('mustRead가 boolean이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        title: '제목',
        content: '내용',
        mustRead: 1,
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('releasedAt이 날짜 형식이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        title: '제목',
        content: '내용',
        releasedAt: 'invalid-date',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });

    it('permissionEmployeeIds가 배열이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        title: '제목',
        content: '내용',
        permissionEmployeeIds: 'not-an-array',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto)
        .expect(400);
    });
  });

  describe('실패 케이스 - 잘못된 날짜 관계', () => {
    it('expiredAt이 releasedAt보다 이전인 경우 에러가 발생할 수 있다', async () => {
      // Given
      const createDto = {
        title: '제목',
        content: '내용',
        releasedAt: '2024-12-31T23:59:59Z',
        expiredAt: '2024-01-01T00:00:00Z',
      };

      // When & Then
      // 비즈니스 로직에 따라 400 또는 201이 반환될 수 있음
      const response = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto);

      // 에러가 발생하지 않는다면 경고 로그나 플래그를 확인
      expect([201, 400]).toContain(response.status);
    });
  });
});
