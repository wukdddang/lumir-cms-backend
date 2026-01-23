import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PUT /api/admin/video-galleries/:id (비디오갤러리 수정)', () => {
  const testSuite = new BaseE2ETest();
  let videoGalleryId: string;
  let categoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트용 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/video-galleries/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 카테고리',
      });
    categoryId = categoryResponse.body.id;

    // 테스트용 비디오갤러리 생성
    const createResponse = await testSuite
      .request()
      .post('/api/admin/video-galleries')
      .send({
        title: '원본 제목',
        description: '원본 설명',
        categoryId,
      });
    videoGalleryId = createResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('비디오갤러리를 수정해야 한다', async () => {
      // Given
      const updateDto = {
        title: '수정된 제목',
        description: '수정된 설명',
      };

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/video-galleries/${videoGalleryId}`)
        .field('title', updateDto.title)
        .field('categoryId', categoryId)
        .field('description', updateDto.description)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: videoGalleryId,
        title: '수정된 제목',
        description: '수정된 설명',
      });
    });

    it('YouTube URL을 수정해야 한다', async () => {
      // Given
      const updateDto = {
        title: '원본 제목',
        youtubeUrls: JSON.stringify([
          'https://www.youtube.com/watch?v=xyz789',
        ]),
      };

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/video-galleries/${videoGalleryId}`)
        .field('title', updateDto.title)
        .field('categoryId', categoryId)
        .field('youtubeUrls', updateDto.youtubeUrls)
        .expect(200);

      // Then
      expect(response.body.videoSources).toBeDefined();
    });

    it('설명을 null로 설정할 수 있어야 한다', async () => {
      // Given
      const updateDto = {
        title: '원본 제목',
        description: '',
      };

      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/video-galleries/${videoGalleryId}`)
        .field('title', updateDto.title)
        .field('categoryId', categoryId)
        .field('description', updateDto.description)
        .expect(200);

      // Then
      expect(response.body.id).toBe(videoGalleryId);
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 비디오갤러리 수정 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';
      const updateDto = {
        title: '수정된 제목',
      };

      // When & Then
      await testSuite
        .request()
        .put(`/api/admin/video-galleries/${nonExistentId}`)
        .field('title', updateDto.title)
        .field('categoryId', categoryId)
        .expect(404);
    });

    it('title이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateDto = {
        categoryId,
        description: '설명만 있음',
      };

      // When & Then
      await testSuite
        .request()
        .put(`/api/admin/video-galleries/${videoGalleryId}`)
        .send(updateDto)
        .expect(400);
    });
  });
});

describe('PATCH /api/admin/video-galleries/:id/public (비디오갤러리 공개 상태 수정)', () => {
  const testSuite = new BaseE2ETest();
  let videoGalleryId: string;
  let categoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트용 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/video-galleries/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 카테고리',
      });
    categoryId = categoryResponse.body.id;

    // 테스트용 비디오갤러리 생성
    const createResponse = await testSuite
      .request()
      .post('/api/admin/video-galleries')
      .send({
        title: '공개 상태 테스트',
        categoryId,
      });
    videoGalleryId = createResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('비디오갤러리를 비공개로 변경해야 한다', async () => {
      // Given
      const updateDto = {
        isPublic: false,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/video-galleries/${videoGalleryId}/public`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(false);
    });

    it('비디오갤러리를 공개로 변경해야 한다', async () => {
      // Given - 먼저 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/video-galleries/${videoGalleryId}/public`)
        .send({ isPublic: false });

      const updateDto = {
        isPublic: true,
      };

      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/video-galleries/${videoGalleryId}/public`)
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(true);
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 비디오갤러리 공개 수정 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/video-galleries/${nonExistentId}/public`)
        .send({ isPublic: false })
        .expect(404);
    });
  });
});

describe('DELETE /api/admin/video-galleries/:id (비디오갤러리 삭제)', () => {
  const testSuite = new BaseE2ETest();
  let videoGalleryId: string;
  let categoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트용 카테고리 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/video-galleries/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 카테고리',
      });
    categoryId = categoryResponse.body.id;

    // 테스트용 비디오갤러리 생성
    const createResponse = await testSuite
      .request()
      .post('/api/admin/video-galleries')
      .send({
        title: '삭제 테스트',
        categoryId,
      });
    videoGalleryId = createResponse.body.id;
  });

  describe('성공 케이스', () => {
    it('비디오갤러리를 삭제해야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .delete(`/api/admin/video-galleries/${videoGalleryId}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
    });

    it('삭제된 비디오갤러리는 조회되지 않아야 한다', async () => {
      // Given - 삭제
      await testSuite
        .request()
        .delete(`/api/admin/video-galleries/${videoGalleryId}`)
        .expect(200);

      // When & Then - 삭제된 비디오갤러리 조회 시 404
      await testSuite
        .request()
        .get(`/api/admin/video-galleries/${videoGalleryId}`)
        .expect(404);
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 비디오갤러리 삭제 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000001';

      // When & Then
      await testSuite
        .request()
        .delete(`/api/admin/video-galleries/${nonExistentId}`)
        .expect(404);
    });
  });
});
