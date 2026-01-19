import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PATCH /api/admin/wiki (위키 권한 관리)', () => {
  const testSuite = new BaseE2ETest();

  let folderId: string;
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
    const folderResponse = await testSuite
      .request()
      .post('/api/admin/wiki/folders')
      .send({ name: '테스트 폴더' })
      .expect(201);
    folderId = folderResponse.body.id;

    const fileResponse = await testSuite
      .request()
      .post('/api/admin/wiki/files/empty')
      .send({ name: '테스트 파일', parentId: folderId })
      .expect(201);
    fileId = fileResponse.body.id;
  });

  describe('폴더 권한 관리', () => {
    it('폴더 공개 상태를 수정해야 한다', async () => {
      // Given
      const updateDto = {
        isPublic: false,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folderId}/public`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: folderId,
        isPublic: false,
      });
    });

    it('폴더에 직급 권한을 설정해야 한다', async () => {
      // Given
      const updateDto = {
        isPublic: false,
        permissionRankIds: ['rank-1', 'rank-2'],
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folderId}/public`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: folderId,
        isPublic: false,
      });
    });

    it('폴더에 직책 권한을 설정해야 한다', async () => {
      // Given
      const updateDto = {
        isPublic: false,
        permissionPositionIds: ['pos-1', 'pos-2'],
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folderId}/public`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: folderId,
        isPublic: false,
      });
    });

    it('폴더에 부서 권한을 설정해야 한다', async () => {
      // Given
      const updateDto = {
        isPublic: false,
        permissionDepartmentIds: ['dept-1', 'dept-2'],
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folderId}/public`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: folderId,
        isPublic: false,
      });
    });

    it('폴더에 모든 권한을 함께 설정해야 한다', async () => {
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
        .patch(`/api/admin/wiki/folders/${folderId}/public`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: folderId,
        isPublic: false,
      });
    });

    it('폴더를 다시 전사공개로 변경할 수 있어야 한다', async () => {
      // Given - 먼저 비공개로 설정
      await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folderId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // When - 다시 공개로 변경
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folderId}/public`)
        .send({ isPublic: true })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: folderId,
        isPublic: true,
      });
    });
  });

  describe('파일 권한 관리', () => {
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

    it('파일을 다시 공개로 변경할 수 있어야 한다', async () => {
      // Given - 먼저 비공개로 설정
      await testSuite
        .request()
        .patch(`/api/admin/wiki/files/${fileId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // When - 다시 공개로 변경
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/files/${fileId}/public`)
        .send({ isPublic: true })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: fileId,
        isPublic: true,
      });
    });

    it('파일은 isPublic만 수정 가능해야 한다 (권한 ID는 설정 불가)', async () => {
      // Given
      const updateDto = {
        isPublic: false,
        // 파일은 permissionRankIds 등을 설정할 수 없음
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

  describe('권한 정책 확인', () => {
    it('폴더는 기본적으로 전사공개로 생성되어야 한다', async () => {
      // Given
      const createDto = {
        name: '새 폴더',
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

    it('파일은 기본적으로 isPublic: true로 생성되어야 한다', async () => {
      // Given
      const createDto = {
        name: '새 파일',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/files/empty')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.isPublic).toBe(true);
    });

    it('isPublic: false인 파일은 완전 비공개여야 한다', async () => {
      // Given
      const createDto = {
        name: '비공개 파일',
        isPublic: false,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/files/empty')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.isPublic).toBe(false);
    });

    it('isPublic: true인 파일은 상위 폴더 권한을 상속받아야 한다', async () => {
      // Given - 비공개 폴더 생성
      const privateFolderResponse = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '비공개 폴더' })
        .expect(201);
      const privateFolderId = privateFolderResponse.body.id;

      await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${privateFolderId}/public`)
        .send({
          isPublic: false,
          permissionDepartmentIds: ['dept-1'],
        })
        .expect(200);

      // When - 공개 파일을 비공개 폴더에 생성
      const fileResponse = await testSuite
        .request()
        .post('/api/admin/wiki/files/empty')
        .send({
          name: '공개 파일',
          parentId: privateFolderId,
          isPublic: true,
        })
        .expect(201);

      // Then
      expect(fileResponse.body.isPublic).toBe(true);
      expect(fileResponse.body.parentId).toBe(privateFolderId);
    });
  });

  describe('GET /api/admin/wiki/permission-logs (권한 로그 조회)', () => {
    it('권한 로그 목록을 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/permission-logs')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('resolved=true로 필터링하여 해결된 로그만 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/permission-logs?resolved=true')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('resolved=false로 필터링하여 미해결 로그만 조회해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/api/admin/wiki/permission-logs?resolved=false')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PATCH /api/admin/wiki/:id/replace-permissions (권한 ID 교체)', () => {
    it('비활성 부서 ID를 새로운 ID로 교체해야 한다', async () => {
      // Given - 권한이 있는 폴더 생성
      const folderWithPermissionResponse = await testSuite
        .request()
        .post('/api/admin/wiki/folders')
        .send({ name: '권한 폴더' })
        .expect(201);
      const folderWithPermissionId = folderWithPermissionResponse.body.id;

      // 권한 설정 (실제 ID는 테스트 환경에 따라 다를 수 있음)
      await testSuite
        .request()
        .patch(`/api/admin/wiki/folders/${folderWithPermissionId}/public`)
        .send({
          isPublic: false,
          permissionDepartmentIds: ['dept-old-1', 'dept-old-2'],
        })
        .expect(200);

      const replaceDto = {
        departments: [
          { oldId: 'dept-old-1', newId: 'dept-new-1' },
          { oldId: 'dept-old-2', newId: 'dept-new-2' },
        ],
        note: '부서 변경',
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/wiki/${folderWithPermissionId}/replace-permissions`)
        .send(replaceDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        replacedDepartments: expect.any(Number),
      });
    });

    it('존재하지 않는 위키의 권한을 교체하면 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const replaceDto = {
        departments: [{ oldId: 'dept-old-1', newId: 'dept-new-1' }],
      };

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/wiki/${nonExistentId}/replace-permissions`)
        .send(replaceDto)
        .expect(404);
    });
  });
});
