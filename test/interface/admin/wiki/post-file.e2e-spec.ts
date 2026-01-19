import { BaseE2ETest } from '../../../base-e2e.spec';

describe('POST /api/admin/wiki/files (파일 생성)', () => {
  const testSuite = new BaseE2ETest();

  let parentFolderId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트용 부모 폴더 생성
    const folderResponse = await testSuite
      .request()
      .post('/api/admin/wiki/folders')
      .send({ name: '테스트 폴더' })
      .expect(201);
    parentFolderId = folderResponse.body.id;
  });

  describe('POST /api/admin/wiki/files/empty (빈 파일 생성)', () => {
    it('기본 빈 파일을 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '빈 파일',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/files/empty')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: '빈 파일',
        type: 'file',
        isPublic: true,
        parentId: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('부모 폴더를 지정하여 빈 파일을 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '하위 빈 파일',
        parentId: parentFolderId,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/files/empty')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        name: '하위 빈 파일',
        parentId: parentFolderId,
        type: 'file',
      });
    });

    it('isPublic을 false로 설정하여 비공개 파일을 생성해야 한다', async () => {
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
      expect(response.body).toMatchObject({
        name: '비공개 파일',
        isPublic: false,
      });
    });

    it('name이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {};

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/wiki/files/empty')
        .send(createDto)
        .expect(400);
    });
  });

  describe('POST /api/admin/wiki/files (파일 생성)', () => {
    it('기본 파일을 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '테스트 파일',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/files')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: '테스트 파일',
        type: 'file',
        isPublic: true,
        parentId: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('제목과 본문을 포함한 파일을 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '문서 파일',
        title: '문서 제목',
        content: '문서 본문 내용입니다.',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/files')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        name: '문서 파일',
        title: '문서 제목',
        content: '문서 본문 내용입니다.',
      });
    });

    it('부모 폴더를 지정하여 파일을 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '하위 파일',
        parentId: parentFolderId,
        title: '하위 파일 제목',
        content: '하위 파일 내용',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/files')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        name: '하위 파일',
        parentId: parentFolderId,
        title: '하위 파일 제목',
        content: '하위 파일 내용',
      });
    });

    it('isPublic을 false로 설정하여 비공개 파일을 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '비공개 파일',
        isPublic: false,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/files')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        name: '비공개 파일',
        isPublic: false,
      });
    });

    it('name이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        title: '제목만 있는 파일',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/wiki/files')
        .send(createDto)
        .expect(400);
    });

    it('여러 개의 파일을 생성해야 한다', async () => {
      // Given
      const files = [
        { name: '파일 1', title: '제목 1' },
        { name: '파일 2', title: '제목 2', content: '내용 2' },
        { name: '파일 3', parentId: parentFolderId },
      ];

      // When & Then
      for (const file of files) {
        const response = await testSuite
          .request()
          .post('/api/admin/wiki/files')
          .send(file)
          .expect(201);

        expect(response.body).toMatchObject({
          name: file.name,
          type: 'file',
        });
      }
    });
  });

  describe('파일 생성 시 기본값 확인', () => {
    it('파일은 기본적으로 isPublic: true로 생성되어야 한다', async () => {
      // Given
      const createDto = {
        name: '기본 파일',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/files')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.isPublic).toBe(true);
    });

    it('parentId를 지정하지 않으면 null로 설정되어야 한다', async () => {
      // Given
      const createDto = {
        name: '루트 파일',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/files')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.parentId).toBeNull();
    });

    it('title과 content는 선택 사항이어야 한다', async () => {
      // Given
      const createDto = {
        name: '제목 없는 파일',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/wiki/files')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.name).toBe('제목 없는 파일');
      // title과 content는 null이거나 undefined일 수 있음
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
        .post('/api/admin/wiki/files')
        .send(createDto)
        .expect(400);
    });

    it('isPublic이 boolean이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        name: '테스트 파일',
        isPublic: 'true',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/wiki/files')
        .send(createDto)
        .expect(400);
    });

    it('존재하지 않는 parentId인 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        name: '테스트 파일',
        parentId: '00000000-0000-0000-0000-000000000000',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/wiki/files')
        .send(createDto)
        .expect(400);
    });
  });
});
