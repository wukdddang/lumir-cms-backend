import { BaseE2ETest } from '../../../base-e2e.spec';

describe('루미르스토리 수정/삭제 (E2E)', () => {
  const testSuite = new BaseE2ETest();
  let lumirStoryId: string;
  let categoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 카테고리 먼저 생성
    const categoryResponse = await testSuite
      .request()
      .post('/api/admin/lumir-stories/categories')
      .send({
        name: '테스트 카테고리',
        description: '테스트용 카테고리',
      });
    categoryId = categoryResponse.body.id;

    // 테스트용 루미르스토리 생성
    const createResponse = await testSuite
      .request()
      .post('/api/admin/lumir-stories')
      .send({
        title: '테스트 루미르 스토리',
        content: '테스트 내용',
        categoryId,
      });
    lumirStoryId = createResponse.body.id;
  });

  describe('PUT /api/admin/lumir-stories/:id - 루미르스토리 수정', () => {
    it('루미르스토리를 수정할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/lumir-stories/${lumirStoryId}`)
        .send({
          title: '수정된 제목',
          content: '수정된 내용',
          categoryId,
        })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: lumirStoryId,
        title: '수정된 제목',
        content: '수정된 내용',
      });
    });

    it('제목과 내용을 함께 수정할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .put(`/api/admin/lumir-stories/${lumirStoryId}`)
        .send({
          title: '수정된 제목',
          content: '기존 내용 유지',
          categoryId,
        })
        .expect(200);

      // Then
      expect(response.body.title).toBe('수정된 제목');
      expect(response.body.content).toBe('기존 내용 유지');
    });

    it('존재하지 않는 루미르스토리를 수정하면 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .put('/api/admin/lumir-stories/00000000-0000-0000-0000-000000000001')
        .send({
          title: '수정 시도',
          content: '수정 내용',
          categoryId,
        })
        .expect(404);
    });
  });

  describe('PATCH /api/admin/lumir-stories/:id/public - 루미르스토리 공개 상태 수정', () => {
    it('루미르스토리를 비공개로 변경할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .patch(`/api/admin/lumir-stories/${lumirStoryId}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(false);
    });

    it('루미르스토리를 공개로 변경할 수 있어야 한다', async () => {
      // Given - 먼저 비공개로 변경
      await testSuite
        .request()
        .patch(`/api/admin/lumir-stories/${lumirStoryId}/public`)
        .send({ isPublic: false });

      // When - 다시 공개로 변경
      const response = await testSuite
        .request()
        .patch(`/api/admin/lumir-stories/${lumirStoryId}/public`)
        .send({ isPublic: true })
        .expect(200);

      // Then
      expect(response.body.isPublic).toBe(true);
    });

    it('존재하지 않는 루미르스토리의 공개 상태를 변경하면 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .patch(
          '/api/admin/lumir-stories/00000000-0000-0000-0000-000000000001/public',
        )
        .send({ isPublic: false })
        .expect(404);
    });

    it('isPublic이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .patch(`/api/admin/lumir-stories/${lumirStoryId}/public`)
        .send({})
        .expect(400);
    });
  });

  describe('DELETE /api/admin/lumir-stories/:id - 루미르스토리 삭제', () => {
    it('루미르스토리를 삭제할 수 있어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .delete(`/api/admin/lumir-stories/${lumirStoryId}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
    });

    it('삭제된 루미르스토리는 조회되지 않아야 한다', async () => {
      // Given - 루미르스토리 삭제
      await testSuite
        .request()
        .delete(`/api/admin/lumir-stories/${lumirStoryId}`)
        .expect(200);

      // When & Then - 삭제된 루미르스토리 조회 시도
      await testSuite
        .request()
        .get(`/api/admin/lumir-stories/${lumirStoryId}`)
        .expect(404);
    });

    it('삭제된 루미르스토리는 목록에 나타나지 않아야 한다', async () => {
      // Given - 루미르스토리 삭제
      await testSuite
        .request()
        .delete(`/api/admin/lumir-stories/${lumirStoryId}`)
        .expect(200);

      // When
      const response = await testSuite
        .request()
        .get('/api/admin/lumir-stories')
        .expect(200);

      // Then
      const found = response.body.items.find(
        (item: any) => item.id === lumirStoryId,
      );
      expect(found).toBeUndefined();
    });

    it('존재하지 않는 루미르스토리를 삭제하면 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .delete('/api/admin/lumir-stories/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });
  });

  describe('PUT /api/admin/lumir-stories/batch-order - 루미르스토리 오더 일괄 수정', () => {
    it('여러 루미르스토리의 오더를 일괄 수정할 수 있어야 한다', async () => {
      // Given - 추가 루미르스토리 생성
      const createResponse1 = await testSuite
        .request()
        .post('/api/admin/lumir-stories')
        .send({
          title: '스토리 1',
          content: '내용 1',
          categoryId,
        });

      const createResponse2 = await testSuite
        .request()
        .post('/api/admin/lumir-stories')
        .send({
          title: '스토리 2',
          content: '내용 2',
          categoryId,
        });

      const id1 = createResponse1.body.id;
      const id2 = createResponse2.body.id;

      // When
      const response = await testSuite
        .request()
        .put('/api/admin/lumir-stories/batch-order')
        .send({
          lumirStories: [
            { id: id1, order: 0 },
            { id: id2, order: 1 },
          ],
        })
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.updatedCount).toBe(2);
    });
  });
});
