import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PUT /api/admin/video-galleries/batch-order (비디오갤러리 오더 일괄 수정)', () => {
  const testSuite = new BaseE2ETest();
  let videoGalleryIds: string[] = [];

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트용 비디오갤러리 여러 개 생성
    const response1 = await testSuite
      .request()
      .post('/api/admin/video-galleries')
      .send({ title: '비디오 갤러리 1' });
    const response2 = await testSuite
      .request()
      .post('/api/admin/video-galleries')
      .send({ title: '비디오 갤러리 2' });
    const response3 = await testSuite
      .request()
      .post('/api/admin/video-galleries')
      .send({ title: '비디오 갤러리 3' });

    videoGalleryIds = [
      response1.body.id,
      response2.body.id,
      response3.body.id,
    ];
  });

  describe('성공 케이스', () => {
    it('여러 비디오갤러리의 오더를 일괄 수정해야 한다', async () => {
      // Given
      const updateDto = {
        videoGalleries: [
          { id: videoGalleryIds[0], order: 2 },
          { id: videoGalleryIds[1], order: 1 },
          { id: videoGalleryIds[2], order: 0 },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .put('/api/admin/video-galleries/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        updatedCount: 3,
      });
    });

    it('수정된 오더가 올바르게 반영되어야 한다', async () => {
      // Given
      const updateDto = {
        videoGalleries: [
          { id: videoGalleryIds[0], order: 10 },
          { id: videoGalleryIds[1], order: 20 },
          { id: videoGalleryIds[2], order: 30 },
        ],
      };

      // When
      await testSuite
        .request()
        .put('/api/admin/video-galleries/batch-order')
        .send(updateDto)
        .expect(200);

      // Then - 각 비디오갤러리 조회하여 오더 확인
      const detail1 = await testSuite
        .request()
        .get(`/api/admin/video-galleries/${videoGalleryIds[0]}`)
        .expect(200);
      const detail2 = await testSuite
        .request()
        .get(`/api/admin/video-galleries/${videoGalleryIds[1]}`)
        .expect(200);
      const detail3 = await testSuite
        .request()
        .get(`/api/admin/video-galleries/${videoGalleryIds[2]}`)
        .expect(200);

      expect(detail1.body.order).toBe(10);
      expect(detail2.body.order).toBe(20);
      expect(detail3.body.order).toBe(30);
    });

    it('빈 배열로 호출하면 400 에러가 발생해야 한다', async () => {
      // Given
      const updateDto = {
        videoGalleries: [],
      };

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/video-galleries/batch-order')
        .send(updateDto)
        .expect(400);
    });

    it('단일 비디오갤러리의 오더를 수정해야 한다', async () => {
      // Given
      const updateDto = {
        videoGalleries: [{ id: videoGalleryIds[0], order: 100 }],
      };

      // When
      const response = await testSuite
        .request()
        .put('/api/admin/video-galleries/batch-order')
        .send(updateDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        updatedCount: 1,
      });
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 비디오갤러리 ID가 포함된 경우 일부만 수정되어야 한다', async () => {
      // Given
      const updateDto = {
        videoGalleries: [
          { id: videoGalleryIds[0], order: 2 },
          { id: '00000000-0000-0000-0000-000000000001', order: 1 }, // 존재하지 않는 ID
          { id: videoGalleryIds[2], order: 0 },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .put('/api/admin/video-galleries/batch-order')
        .send(updateDto)
        .expect(200);

      // Then - 2개만 성공
      expect(response.body.updatedCount).toBe(2);
      expect(response.body.success).toBe(false);
    });

    it('videoGalleries 배열이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateDto = {};

      // When & Then
      await testSuite
        .request()
        .put('/api/admin/video-galleries/batch-order')
        .send(updateDto)
        .expect(400);
    });
  });

  describe('순서 정렬 확인', () => {
    it('오더가 올바른 순서로 정렬되어야 한다', async () => {
      // Given - 오더를 역순으로 변경
      const updateDto = {
        videoGalleries: [
          { id: videoGalleryIds[2], order: 0 },
          { id: videoGalleryIds[1], order: 1 },
          { id: videoGalleryIds[0], order: 2 },
        ],
      };

      // When
      await testSuite
        .request()
        .put('/api/admin/video-galleries/batch-order')
        .send(updateDto)
        .expect(200);

      // Then - 목록 조회하여 순서 확인
      const listResponse = await testSuite
        .request()
        .get('/api/admin/video-galleries?orderBy=order')
        .expect(200);

      const items = listResponse.body.items;
      expect(items[0].id).toBe(videoGalleryIds[2]);
      expect(items[1].id).toBe(videoGalleryIds[1]);
      expect(items[2].id).toBe(videoGalleryIds[0]);
    });
  });
});
