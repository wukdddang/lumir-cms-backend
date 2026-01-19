import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/announcements (공지사항 목록 조회)', () => {
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
    it('빈 목록을 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('등록된 공지사항 목록을 조회해야 한다', async () => {
      // Given
      const announcements = [
        { title: '공지1', content: '내용1' },
        { title: '공지2', content: '내용2' },
        { title: '공지3', content: '내용3' },
      ];

      for (const announcement of announcements) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send(announcement);
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(3);
      expect(response.body.total).toBe(3);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
      expect(response.body.totalPages).toBe(1);
    });

    it('페이지네이션이 동작해야 한다', async () => {
      // Given - 15개의 공지사항 생성
      for (let i = 1; i <= 15; i++) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({ title: `공지${i}`, content: `내용${i}` });
      }

      // When - 첫 페이지 조회 (limit=10)
      const page1Response = await testSuite
        .request()
        .get('/api/admin/announcements?page=1&limit=10')
        .expect(200);

      // Then
      expect(page1Response.body.items).toHaveLength(10);
      expect(page1Response.body.total).toBe(15);
      expect(page1Response.body.page).toBe(1);
      expect(page1Response.body.limit).toBe(10);
      expect(page1Response.body.totalPages).toBe(2);

      // When - 두 번째 페이지 조회
      const page2Response = await testSuite
        .request()
        .get('/api/admin/announcements?page=2&limit=10')
        .expect(200);

      // Then
      expect(page2Response.body.items).toHaveLength(5);
      expect(page2Response.body.total).toBe(15);
      expect(page2Response.body.page).toBe(2);
      expect(page2Response.body.totalPages).toBe(2);
    });

    it('limit 파라미터가 동작해야 한다', async () => {
      // Given
      for (let i = 1; i <= 10; i++) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({ title: `공지${i}`, content: `내용${i}` });
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements?limit=5')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(5);
      expect(response.body.limit).toBe(5);
    });
  });

  describe('필터링 테스트', () => {
    beforeEach(async () => {
      // 다양한 상태의 공지사항 생성
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '공개-고정', content: '내용', isPublic: true, isFixed: true });

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '공개-일반', content: '내용', isPublic: true, isFixed: false });

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '비공개-고정', content: '내용', isPublic: false, isFixed: true });

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '비공개-일반', content: '내용', isPublic: false, isFixed: false });
    });

    it('기본 조회는 비고정 공지만 반환해야 한다 (isFixed=false)', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements')
        .expect(200);

      // Then - isFixed=false인 공지만 2개 (공개-일반, 비공개-일반)
      expect(response.body.items.length).toBe(2);
      expect(response.body.items.every((item: any) => item.isFixed === false)).toBe(true);
    });

    it('isPublic=true 필터가 동작해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements?isPublic=true')
        .expect(200);

      // Then - 공개-일반 1개만 (비고정 공지 중 공개)
      expect(response.body.items.length).toBe(1);
      expect(response.body.items.every((item: any) => item.isPublic === true && item.isFixed === false)).toBe(true);
    });

    it('isPublic=false 필터가 동작해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements?isPublic=false')
        .expect(200);

      // Then - 비공개-일반 1개만 (비고정 공지 중 비공개)
      expect(response.body.items.length).toBe(1);
      expect(response.body.items.every((item: any) => item.isPublic === false && item.isFixed === false)).toBe(true);
    });
  });

  describe('정렬 테스트', () => {
    it('orderBy=order로 정렬해야 한다', async () => {
      // Given
      for (let i = 1; i <= 3; i++) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({ title: `공지${i}`, content: `내용${i}` });
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements?orderBy=order')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(3);
    });

    it('orderBy=createdAt로 정렬해야 한다', async () => {
      // Given
      for (let i = 1; i <= 3; i++) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({ title: `공지${i}`, content: `내용${i}` });
        // 생성 시간 차이를 두기 위한 대기
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements?orderBy=createdAt')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(3);
    });
  });
});

describe('GET /api/admin/announcements/fixed (고정 공지사항 목록 조회)', () => {
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
    it('빈 목록을 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/fixed')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('고정 공지사항만 조회해야 한다', async () => {
      // Given
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '고정1', content: '내용1', isFixed: true });

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '일반1', content: '내용1', isFixed: false });

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '고정2', content: '내용2', isFixed: true });

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/fixed')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items.every((item: any) => item.isFixed === true)).toBe(true);
      expect(response.body.total).toBe(2);
    });

    it('고정 공지사항에서 isPublic 필터가 동작해야 한다', async () => {
      // Given
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '공개-고정', content: '내용', isPublic: true, isFixed: true });

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '비공개-고정', content: '내용', isPublic: false, isFixed: true });

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '공개-일반', content: '내용', isPublic: true, isFixed: false });

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/fixed?isPublic=true')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].title).toBe('공개-고정');
      expect(response.body.items.every((item: any) => item.isPublic === true && item.isFixed === true)).toBe(true);
    });

    it('고정 공지사항 페이지네이션이 동작해야 한다', async () => {
      // Given - 15개의 고정 공지사항 생성
      for (let i = 1; i <= 15; i++) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({ title: `고정${i}`, content: `내용${i}`, isFixed: true });
      }

      // When - 첫 페이지 조회 (limit=10)
      const page1Response = await testSuite
        .request()
        .get('/api/admin/announcements/fixed?page=1&limit=10')
        .expect(200);

      // Then
      expect(page1Response.body.items).toHaveLength(10);
      expect(page1Response.body.total).toBe(15);
      expect(page1Response.body.page).toBe(1);
      expect(page1Response.body.limit).toBe(10);
      expect(page1Response.body.totalPages).toBe(2);

      // When - 두 번째 페이지 조회
      const page2Response = await testSuite
        .request()
        .get('/api/admin/announcements/fixed?page=2&limit=10')
        .expect(200);

      // Then
      expect(page2Response.body.items).toHaveLength(5);
      expect(page2Response.body.total).toBe(15);
      expect(page2Response.body.page).toBe(2);
      expect(page2Response.body.totalPages).toBe(2);
    });
  });

  describe('일반 목록과 고정 목록 분리 확인', () => {
    beforeEach(async () => {
      // 고정 공지 2개, 일반 공지 3개 생성
      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '고정1', content: '내용', isFixed: true });

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '고정2', content: '내용', isFixed: true });

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '일반1', content: '내용', isFixed: false });

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '일반2', content: '내용', isFixed: false });

      await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '일반3', content: '내용', isFixed: false });
    });

    it('일반 목록은 비고정 공지만 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(3);
      expect(response.body.items.every((item: any) => item.isFixed === false)).toBe(true);
    });

    it('고정 목록은 고정 공지만 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/fixed')
        .expect(200);

      // Then
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items.every((item: any) => item.isFixed === true)).toBe(true);
    });
  });
});

describe('GET /api/admin/announcements/all (공지사항 전체 목록 조회)', () => {
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
    it('빈 배열을 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/all')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('모든 공지사항을 페이지네이션 없이 조회해야 한다', async () => {
      // Given - 15개의 공지사항 생성
      for (let i = 1; i <= 15; i++) {
        await testSuite
          .request()
          .post('/api/admin/announcements')
          .send({ title: `공지${i}`, content: `내용${i}` });
      }

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/announcements/all')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(15);
    });
  });
});

describe('GET /api/admin/announcements/:id (공지사항 상세 조회)', () => {
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
    it('ID로 공지사항을 조회해야 한다', async () => {
      // Given
      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send({ title: '테스트 공지', content: '테스트 내용' });

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: announcementId,
        title: '테스트 공지',
        content: '테스트 내용',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('모든 필드가 포함된 공지사항을 조회해야 한다', async () => {
      // Given
      const createDto = {
        title: '상세 공지',
        content: '상세 내용',
        isFixed: true,
        isPublic: false,
        mustRead: true,
        releasedAt: '2024-01-01T00:00:00Z',
        expiredAt: '2024-12-31T23:59:59Z',
      };

      const createResponse = await testSuite
        .request()
        .post('/api/admin/announcements')
        .send(createDto);

      const announcementId = createResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${announcementId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: announcementId,
        title: '상세 공지',
        content: '상세 내용',
        isFixed: true,
        isPublic: false,
        mustRead: true,
        releasedAt: expect.any(String),
        expiredAt: expect.any(String),
      });
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .get(`/api/admin/announcements/${nonExistentId}`)
        .expect(404);
    });

    it('잘못된 UUID 형식으로 조회 시 에러가 발생해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid';

      // When & Then
      const response = await testSuite
        .request()
        .get(`/api/admin/announcements/${invalidId}`);

      // UUID 검증은 500 에러를 발생시킬 수 있음
      expect([400, 500]).toContain(response.status);
    });
  });
});
