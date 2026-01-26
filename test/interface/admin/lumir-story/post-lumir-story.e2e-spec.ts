import { BaseE2ETest } from '../../../base-e2e.spec';

describe('POST /api/admin/lumir-stories (루미르스토리 생성)', () => {
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
    it('유효한 데이터로 루미르스토리를 생성해야 한다', async () => {
      // Given: 카테고리 먼저 생성
      const categoryResponse = await testSuite
        .request()
        .post('/api/admin/lumir-stories/categories')
        .send({
          name: '혁신',
          description: '혁신 관련 스토리',
        })
        .expect(201);

      const categoryId = categoryResponse.body.id;

      const createDto = {
        title: '루미르 스토리 제목',
        content: '루미르 스토리 내용',
        categoryId,
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/lumir-stories')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: '루미르 스토리 제목',
        content: '루미르 스토리 내용',
        categoryId,
        isPublic: true, // 기본값 확인
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(response.body.categoryName).toBeDefined();
    });

    it('이미지 URL을 포함한 루미르스토리를 생성해야 한다', async () => {
      // Given: 카테고리 먼저 생성
      const categoryResponse = await testSuite
        .request()
        .post('/api/admin/lumir-stories/categories')
        .send({
          name: '성장',
          description: '성장 관련 스토리',
        })
        .expect(201);

      const categoryId = categoryResponse.body.id;

      const createDto = {
        title: '루미르 스토리 제목',
        content: '루미르 스토리 내용',
        categoryId,
        imageUrl: 'https://s3.aws.com/image.jpg',
      };

      // When
      const response = await testSuite
        .request()
        .post('/api/admin/lumir-stories')
        .send(createDto)
        .expect(201);

      // Then
      expect(response.body.imageUrl).toBe('https://s3.aws.com/image.jpg');
      expect(response.body.categoryId).toBe(categoryId);
    });
  });

  describe('실패 케이스 - 필수 필드 누락', () => {
    it('title이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        content: '내용만 있음',
        categoryId: 'some-category-id',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/lumir-stories')
        .send(createDto)
        .expect(400);
    });

    it('content가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        title: '제목만 있음',
        categoryId: 'some-category-id',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/lumir-stories')
        .send(createDto)
        .expect(400);
    });

    it('categoryId가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const createDto = {
        title: '제목',
        content: '내용',
      };

      // When & Then
      await testSuite
        .request()
        .post('/api/admin/lumir-stories')
        .send(createDto)
        .expect(400);
    });
  });
});
