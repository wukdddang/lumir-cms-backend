import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/wiki (위키 조회)', () => {
  const testSuite = new BaseE2ETest();

  let rootFolderId: string;
  let subFolderId: string;
  let fileId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트 데이터 생성
    const rootFolderResponse = await testSuite
      .request()
      .post('/api/admin/wiki/folders')
      .send({ name: '루트 폴더' })
      .expect(201);
    rootFolderId = rootFolderResponse.body.id;

    const subFolderResponse = await testSuite
      .request()
      .post('/api/admin/wiki/folders')
      .send({ name: '하위 폴더', parentId: rootFolderId })
      .expect(201);
    subFolderId = subFolderResponse.body.id;

    const fileResponse = await testSuite
      .request()
      .post('/api/admin/wiki/files/empty')
      .send({ name: '테스트 파일', parentId: rootFolderId })
      .expect(201);
    fileId = fileResponse.body.id;
  });

  describe('GET /api/admin/wiki/folders/structure (폴더 구조 조회)', () => {
    it('전체 폴더 구조를 트리 형태로 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/folders/structure')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
      });
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it('ancestorId를 지정하여 특정 폴더의 하위 구조를 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/wiki/folders/structure?ancestorId=${rootFolderId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
      });
    });
  });

  describe('GET /api/admin/wiki/folders/:id (폴더 상세 조회)', () => {
    it('폴더 상세 정보와 하위 항목을 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/wiki/folders/${rootFolderId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: rootFolderId,
        name: '루트 폴더',
        type: 'folder',
      });
      expect(response.body.children).toBeDefined();
    });

    it('존재하지 않는 폴더를 조회하면 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await testSuite
        .request()
        .get(`/api/admin/wiki/folders/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('GET /api/admin/wiki/folders/:id/children (폴더 하위 항목 조회)', () => {
    it('폴더의 하위 폴더 및 파일 목록을 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/wiki/folders/${rootFolderId}/children`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
      });
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it('하위 항목이 없는 폴더는 빈 배열을 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/wiki/folders/${subFolderId}/children`)
        .expect(200);

      // Then
      expect(response.body.items).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('GET /api/admin/wiki/files (파일 목록 조회)', () => {
    it('parentId로 파일 목록을 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/wiki/files?parentId=${rootFolderId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
      });
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it('parentId 없이 루트 파일을 조회해야 한다', async () => {
      // Given - 루트 파일 생성
      await testSuite
        .request()
        .post('/api/admin/wiki/files/empty')
        .send({ name: '루트 파일' })
        .expect(201);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/files')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
      });
    });
  });

  describe('GET /api/admin/wiki/files/:id (파일 상세 조회)', () => {
    it('파일 상세 정보를 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(`/api/admin/wiki/files/${fileId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: fileId,
        name: '테스트 파일',
        type: 'file',
      });
    });

    it('존재하지 않는 파일을 조회하면 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await testSuite
        .request()
        .get(`/api/admin/wiki/files/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('GET /api/admin/wiki/files/search (파일 검색)', () => {
    it('검색어로 파일을 검색해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/files/search?query=테스트')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
      });
    });

    it('검색어가 없으면 빈 결과를 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/files/search?query=')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: [],
        total: 0,
      });
    });

    it('검색어가 공백만 있으면 빈 결과를 반환해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/files/search?query=   ')
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        items: [],
        total: 0,
      });
    });

    it('검색 결과에 경로 정보가 포함되어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/files/search?query=테스트')
        .expect(200);

      // Then
      if (response.body.items.length > 0) {
        expect(response.body.items[0]).toHaveProperty('path');
      }
    });
  });
});
