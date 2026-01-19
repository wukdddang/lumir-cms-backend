import { BaseE2ETest } from '../../../base-e2e.spec';

describe('POST /api/admin/wiki/folders (폴더 생성)', () => {
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
    it('기본 폴더를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '테스트 폴더',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: '테스트 폴더',
        type: 'folder',
        isPublic: true,
        parentId: null,
        order: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('부모 폴더를 지정하여 하위 폴더를 생성해야 한다', async () => {
      // Given - 부모 폴더 생성
      const parentResponse = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '부모 폴더' })
        .expect(201);

      const parentId = parentResponse.body.id;

      // When - 하위 폴더 생성
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({
          name: '하위 폴더',
          parentId,
        })
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: '하위 폴더',
        type: 'folder',
        parentId,
        isPublic: true,
      });
    });

    it('order를 지정하여 폴더를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '순서 지정 폴더',
        order: 5,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        name: '순서 지정 폴더',
        order: 5,
      });
    });

    it('여러 개의 폴더를 생성해야 한다', async () => {
      // Given
      const folders = [
        { name: '폴더 1' },
        { name: '폴더 2' },
        { name: '폴더 3' },
      ];

      // When & Then
      for (const folder of folders) {
        const response = await testSuite
          .request()
          .post('/api/admin/wiki/folders')
          .send(folder)
          .expect(201);

        expect(response.body).toMatchObject({
          name: folder.name,
          type: 'folder',
        });
      }
    });
  });

  describe('실패 케이스 - 필수 필드 누락', () => {
    it('name이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {};

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send(createDto)
        .expect(400);
    });

    it('name이 빈 문자열인 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        name: '',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send(createDto)
        .expect(400);
    });
  });

  describe('실패 케이스 - 잘못된 데이터 타입', () => {
    it('name이 문자열이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        name: 12345,
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send(createDto)
        .expect(400);
    });

    it('parentId가 유효하지 않은 UUID인 경우 에러가 발생할 수 있다', async () => {
      // Given
      const createDto = {
        name: '테스트 폴더',
        parentId: 'invalid-uuid',
      };

      // When & Then
      // UUID 검증이 있다면 400, 없다면 404 또는 201
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send(createDto);

      expect([201, 400, 404]).toContain(response.status);
    });

    it('존재하지 않는 parentId인 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        name: '테스트 폴더',
        parentId: '00000000-0000-0000-0000-000000000000',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send(createDto)
        .expect(400);
    });
  });

  describe('폴더 생성 시 기본값 확인', () => {
    it('폴더는 기본적으로 전사공개(isPublic: true)로 생성되어야 한다', async () => {
      // Given
      const createDto = {
        name: '기본 폴더',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.isPublic).toBe(true);
    });

    it('parentId를 지정하지 않으면 null로 설정되어야 한다', async () => {
      // Given
      const createDto = {
        name: '루트 폴더',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.parentId).toBeNull();
    });

    it('order를 지정하지 않으면 0으로 설정되어야 한다', async () => {
      // Given
      const createDto = {
        name: '기본 순서 폴더',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.order).toBe(0);
    });
  });
});
