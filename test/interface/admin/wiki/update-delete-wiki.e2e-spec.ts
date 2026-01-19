import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PATCH/DELETE /api/admin/wiki (위키 수정/삭제)', () => {
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

  describe('PATCH /api/admin/wiki/folders/:id (폴더 수정)', () => {
    it('폴더 이름을 수정해야 한다', async () => {
      // Given
      const updateDto = {
        name: '수정된 폴더명',
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${rootFolderId}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: rootFolderId,
        name: '수정된 폴더명',
      });
    });

    it('폴더 순서를 수정해야 한다', async () => {
      // Given
      const updateDto = {
        order: 10,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${rootFolderId}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: rootFolderId,
        order: 10,
      });
    });

    it('폴더 권한을 수정해야 한다', async () => {
      // Given
      const updateDto = {
        isPublic: false,
        permissionRankIds: ['rank-1'],
        permissionPositionIds: ['pos-1'],
        permissionDepartmentIds: ['dept-1'],
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${rootFolderId}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: rootFolderId,
        isPublic: false,
      });
    });

    it('존재하지 않는 폴더를 수정하면 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateDto = {
        name: '수정된 이름',
      };

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${nonExistentId}`)
        .send(updateDto)
        .expect(404);
    });
  });

  describe('PATCH /api/admin/wiki/folders/:id/name (폴더 이름만 수정)', () => {
    it('폴더 이름만 수정해야 한다', async () => {
      // Given
      const updateDto = {
        name: '새 폴더명',
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${rootFolderId}/name`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: rootFolderId,
        name: '새 폴더명',
      });
    });
  });

  describe('PATCH /api/admin/wiki/folders/:id/path (폴더 경로 수정)', () => {
    it('폴더의 부모를 변경해야 한다', async () => {
      // Given - 새로운 부모 폴더 생성
      const newParentResponse = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '새 부모 폴더' })
        .expect(201);
      const newParentId = newParentResponse.body.id;

      const updateDto = {
        parentId: newParentId,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${subFolderId}/path`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: subFolderId,
        parentId: newParentId,
      });
    });

    it('폴더를 루트로 이동시킬 수 있어야 한다', async () => {
      // Given
      const updateDto = {
        parentId: null,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${subFolderId}/path`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: subFolderId,
        parentId: null,
      });
    });
  });

  describe('PATCH /api/admin/wiki/folders/:id/public (폴더 공개 수정)', () => {
    it('폴더 공개 상태를 수정해야 한다', async () => {
      // Given
      const updateDto = {
        isPublic: false,
        permissionRankIds: ['rank-1'],
        permissionPositionIds: ['pos-1'],
        permissionDepartmentIds: ['dept-1'],
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${rootFolderId}/public`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: rootFolderId,
        isPublic: false,
      });
    });
  });

  describe('PUT /api/admin/wiki/files/:id (파일 수정)', () => {
    it('파일 이름을 수정해야 한다', async () => {
      // Given
      const updateDto = {
        name: '수정된 파일명',
      };

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/wiki/files/${fileId}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: fileId,
        name: '수정된 파일명',
      });
    });

    it('파일 제목과 본문을 수정해야 한다', async () => {
      // Given
      const updateDto = {
        name: '테스트 파일',
        title: '수정된 제목',
        content: '수정된 본문',
      };

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/wiki/files/${fileId}`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: fileId,
        title: '수정된 제목',
        content: '수정된 본문',
      });
    });

    it('name이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateDto = {
        title: '제목만 있는 수정',
      };

      // When & Then
      await testSuite
        .request()
        .put(`/api/admin/wiki/files/${fileId}`)
        .send(updateDto)
        .expect(400);
    });

    it('존재하지 않는 파일을 수정하면 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateDto = {
        name: '수정된 이름',
      };

      // When & Then
      await testSuite
        .request()
        .put(`/api/admin/wiki/files/${nonExistentId}`)
        .send(updateDto)
        .expect(404);
    });
  });

  describe('PATCH /api/admin/wiki/files/:id/path (파일 경로 수정)', () => {
    it('파일의 부모 폴더를 변경해야 한다', async () => {
      // Given - 새로운 부모 폴더 생성
      const newParentResponse = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '새 부모 폴더' })
        .expect(201);
      const newParentId = newParentResponse.body.id;

      const updateDto = {
        parentId: newParentId,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/files/${fileId}/path`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: fileId,
        parentId: newParentId,
      });
    });

    it('파일을 루트로 이동시킬 수 있어야 한다', async () => {
      // Given
      const updateDto = {
        parentId: null,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/files/${fileId}/path`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: fileId,
        parentId: null,
      });
    });
  });

  describe('PATCH /api/admin/wiki/files/:id/public (파일 공개 수정)', () => {
    it('파일 공개 상태를 수정해야 한다', async () => {
      // Given
      const updateDto = {
        isPublic: false,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/files/${fileId}/public`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: fileId,
        isPublic: false,
      });
    });
  });

  describe('DELETE /api/admin/wiki/folders/:id (폴더 삭제)', () => {
    it('폴더와 하위 항목을 모두 삭제해야 한다', async () => {
      // Given - 하위 항목이 있는 폴더
      const folderWithChildrenResponse = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '하위 항목이 있는 폴더' })
        .expect(201);
      const folderWithChildrenId = folderWithChildrenResponse.body.id;

      await testSuite
        .request()
        .post('/api/admin/wiki/files/empty')
        .send({ name: '하위 파일', parentId: folderWithChildrenId })
        .expect(201);

      // When
      const response = await testSuite
        .request()
        .delete(`/api/admin/wiki/folders/${folderWithChildrenId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
      });

      // 삭제 확인
      await testSuite
        .request()
        .get(`/api/admin/wiki/folders/${folderWithChildrenId}`)
        .expect(404);
    });

    it('존재하지 않는 폴더를 삭제하면 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await testSuite
        .request()
        .delete(`/api/admin/wiki/folders/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('DELETE /api/admin/wiki/folders/:id/only (폴더만 삭제)', () => {
    it('하위 항목이 없는 폴더만 삭제해야 한다', async () => {
      // Given - 하위 항목이 없는 폴더
      const emptyFolderResponse = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '빈 폴더' })
        .expect(201);
      const emptyFolderId = emptyFolderResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .delete(`/api/admin/wiki/folders/${emptyFolderId}/only`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
      });
    });

    it('하위 항목이 있는 폴더는 삭제하지 못해야 한다', async () => {
      // Given - 하위 항목이 있는 폴더
      const folderWithChildrenResponse = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '하위 항목이 있는 폴더' })
        .expect(201);
      const folderWithChildrenId = folderWithChildrenResponse.body.id;

      await testSuite
        .request()
        .post('/api/admin/wiki/files/empty')
        .send({ name: '하위 파일', parentId: folderWithChildrenId })
        .expect(201);

      // When & Then
      // 하위 항목이 있으면 에러 발생 (400)
      await testSuite
        .request()
        .delete(`/api/admin/wiki/folders/${folderWithChildrenId}/only`)
        .expect(400);
    });
  });

  describe('DELETE /api/admin/wiki/files/:id (파일 삭제)', () => {
    it('파일을 삭제해야 한다', async () => {
      // Given
      const fileToDeleteResponse = await testSuite
        .request()
        .post('/api/admin/wiki/files/empty')
        .send({ name: '삭제할 파일' })
        .expect(201);
      const fileToDeleteId = fileToDeleteResponse.body.id;

      // When
      const response = await testSuite
        .request()
        .delete(`/api/admin/wiki/files/${fileToDeleteId}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
      });

      // 삭제 확인
      await testSuite
        .request()
        .get(`/api/admin/wiki/files/${fileToDeleteId}`)
        .expect(404);
    });

    it('존재하지 않는 파일을 삭제하면 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await testSuite
        .request()
        .delete(`/api/admin/wiki/files/${nonExistentId}`)
        .expect(404);
    });
  });
});
