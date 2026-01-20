import { BaseE2ETest } from '../../../base-e2e.spec';

describe('GET /api/admin/wiki/folders/by-path (경로로 폴더 조회)', () => {
  const testSuite = new BaseE2ETest();

  let rootFolderId: string;
  let subFolderId: string;
  let deepFolderId: string;
  let fileId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트 데이터 생성: 루트 폴더 > 하위 폴더 > 깊은 폴더
    const rootFolderResponse = await testSuite
      .request()
      .post('/api/admin/wiki/folders')
      .send({ name: '회의록' })
      .expect(201);
    rootFolderId = rootFolderResponse.body.id;

    const subFolderResponse = await testSuite
      .request()
      .post('/api/admin/wiki/folders')
      .send({ name: '2024년', parentId: rootFolderId })
      .expect(201);
    subFolderId = subFolderResponse.body.id;

    const deepFolderResponse = await testSuite
      .request()
      .post('/api/admin/wiki/folders')
      .send({ name: '1월', parentId: subFolderId })
      .expect(201);
    deepFolderId = deepFolderResponse.body.id;

    // 하위 항목 테스트를 위해 파일 생성
    const fileResponse = await testSuite
      .request()
      .post('/api/admin/wiki/files/empty')
      .send({ name: '회의록 파일', parentId: deepFolderId })
      .expect(201);
    fileId = fileResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('루트 폴더를 경로로 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '회의록' })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: rootFolderId,
        name: '회의록',
        type: 'folder',
        parentId: null,
      });
      expect(response.body.children).toBeDefined();
      expect(response.body.children.length).toBeGreaterThan(0);
    });

    it('하위 폴더를 경로로 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '회의록/2024년' })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: subFolderId,
        name: '2024년',
        type: 'folder',
        parentId: rootFolderId,
      });
      expect(response.body.children).toBeDefined();
    });

    it('깊은 경로의 폴더를 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '회의록/2024년/1월' })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: deepFolderId,
        name: '1월',
        type: 'folder',
        parentId: subFolderId,
      });
      expect(response.body.children).toBeDefined();
      expect(response.body.children.length).toBe(1);
      expect(response.body.children[0].name).toBe('회의록 파일');
    });

    it('경로 앞에 슬래시가 있어도 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '/회의록/2024년' })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: subFolderId,
        name: '2024년',
        type: 'folder',
      });
    });

    it('경로 뒤에 슬래시가 있어도 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '회의록/2024년/' })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: subFolderId,
        name: '2024년',
        type: 'folder',
      });
    });

    it('경로 앞뒤에 슬래시가 있어도 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '/회의록/2024년/' })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: subFolderId,
        name: '2024년',
        type: 'folder',
      });
    });

    it('하위 항목 정보를 포함해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '회의록/2024년/1월' })
        .expect(200);

      // Then
      expect(response.body.children).toBeDefined();
      expect(Array.isArray(response.body.children)).toBe(true);
      expect(response.body.children.length).toBeGreaterThan(0);
    });
  });

  describe('실패 케이스 - 잘못된 경로', () => {
    it('존재하지 않는 폴더 경로는 404 에러를 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '존재하지않는폴더' })
        .expect(404);
    });

    it('중간 경로가 없으면 404 에러를 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '회의록/존재하지않는폴더/1월' })
        .expect(404);
    });

    it('경로가 비어있으면 400 에러를 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '' })
        .expect(400);
    });

    it('경로가 슬래시만 있으면 400 에러를 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '/' })
        .expect(400);
    });

    it('경로 파라미터가 없으면 400 에러를 반환해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .expect(400);
    });
  });

  describe('ID로 조회한 결과와 동일성 검증', () => {
    it('경로로 조회한 결과가 ID로 조회한 결과와 동일해야 한다', async () => {
      // Given - ID로 조회
      const idResponse = await testSuite
        .request()
        .get(`/api/admin/wiki/folders/${subFolderId}`)
        .expect(200);

      // When - 경로로 조회
      const pathResponse = await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '회의록/2024년' })
        .expect(200);

      // Then - 결과 비교
      expect(pathResponse.body.id).toBe(idResponse.body.id);
      expect(pathResponse.body.name).toBe(idResponse.body.name);
      expect(pathResponse.body.type).toBe(idResponse.body.type);
      expect(pathResponse.body.parentId).toBe(idResponse.body.parentId);
      expect(pathResponse.body.depth).toBe(idResponse.body.depth);

      // 하위 항목도 동일해야 함
      expect(pathResponse.body.children).toEqual(idResponse.body.children);
    });
  });

  describe('특수 문자가 포함된 폴더명', () => {
    let specialFolderId: string;

    beforeEach(async () => {
      // 특수 문자가 포함된 폴더 생성
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '특수-폴더_2024 (테스트)', parentId: rootFolderId })
        .expect(201);
      specialFolderId = response.body.id;
    });

    it('특수 문자가 포함된 폴더명으로 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '회의록/특수-폴더_2024 (테스트)' })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: specialFolderId,
        name: '특수-폴더_2024 (테스트)',
        type: 'folder',
        parentId: rootFolderId,
      });
    });
  });

  describe('공백이 포함된 폴더명', () => {
    let spaceFolderId: string;

    beforeEach(async () => {
      // 공백이 포함된 폴더 생성
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '공백 있는 폴더', parentId: rootFolderId })
        .expect(201);
      spaceFolderId = response.body.id;
    });

    it('공백이 포함된 폴더명으로 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/folders/by-path')
        .query({ path: '회의록/공백 있는 폴더' })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: spaceFolderId,
        name: '공백 있는 폴더',
        type: 'folder',
        parentId: rootFolderId,
      });
    });
  });
});
