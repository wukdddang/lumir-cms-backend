import { BaseE2ETest } from '../../../base-e2e.spec';
import * as path from 'path';
import * as fs from 'fs';

describe('POST/PUT/DELETE /api/admin/news (뉴스 생성/수정/삭제)', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    await testSuite.beforeAll();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanupSpecificTables(['news']);
  });

  describe('POST /api/admin/news (뉴스 생성)', () => {
    describe('성공 케이스', () => {
      it('파일 없이 뉴스를 생성해야 한다', async () => {
        // When
        const response = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', '루미르 신제품 출시')
          .field('description', '혁신적인 신제품이 출시되었습니다')
          .field('url', 'https://news.example.com/lumir')
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);

        // Then
        expect(response.body).toMatchObject({
          id: expect.any(String),
          title: '루미르 신제품 출시',
          description: '혁신적인 신제품이 출시되었습니다',
          url: 'https://news.example.com/lumir',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          isPublic: true,
          order: expect.any(Number),
          attachments: null,
        });
        expect(response.body.categoryName).toBeDefined();
      });

      it('파일과 함께 뉴스를 생성해야 한다', async () => {
        // Given - 테스트용 파일 생성
        const testDir = path.join(__dirname, 'test-files');
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }

        const testFilePath = path.join(testDir, 'test-news.pdf');
        fs.writeFileSync(testFilePath, 'test pdf content');

        try {
          // When
          const response = await testSuite
            .request()
            .post('/api/admin/news')
            .field('title', '파일이 있는 뉴스')
            .field('description', '첨부파일이 포함된 뉴스입니다')
            .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
            .attach('files', testFilePath)
            .expect(201);

          // Then
          expect(response.body).toMatchObject({
            id: expect.any(String),
            title: '파일이 있는 뉴스',
            description: '첨부파일이 포함된 뉴스입니다',
            attachments: expect.arrayContaining([
              expect.objectContaining({
                fileName: expect.any(String),
                fileUrl: expect.any(String),
                fileSize: expect.any(Number),
                mimeType: expect.any(String),
              }),
            ]),
          });
          expect(response.body.categoryName).toBeDefined();
        } finally {
          // Cleanup
          if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
          }
          if (fs.existsSync(testDir)) {
            fs.rmdirSync(testDir);
          }
        }
      });

      it('여러 파일과 함께 뉴스를 생성해야 한다', async () => {
        // Given - 테스트용 파일들 생성
        const testDir = path.join(__dirname, 'test-files');
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }

        const testFile1Path = path.join(testDir, 'test-news1.pdf');
        const testFile2Path = path.join(testDir, 'test-news2.jpg');
        fs.writeFileSync(testFile1Path, 'test pdf content');
        fs.writeFileSync(testFile2Path, 'test jpg content');

        try {
          // When
          const response = await testSuite
            .request()
            .post('/api/admin/news')
            .field('title', '여러 파일이 있는 뉴스')
            .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
            .attach('files', testFile1Path)
            .attach('files', testFile2Path)
            .expect(201);

          // Then
          expect(response.body.attachments).toHaveLength(2);
        } finally {
          // Cleanup
          if (fs.existsSync(testFile1Path)) {
            fs.unlinkSync(testFile1Path);
          }
          if (fs.existsSync(testFile2Path)) {
            fs.unlinkSync(testFile2Path);
          }
          if (fs.existsSync(testDir)) {
            fs.rmdirSync(testDir);
          }
        }
      });

      it('필수 필드만으로 뉴스를 생성해야 한다', async () => {
        // When
        const response = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', '제목만 있는 뉴스')
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);

        // Then
        expect(response.body).toMatchObject({
          title: '제목만 있는 뉴스',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          isPublic: true,
        });
        expect(response.body.categoryName).toBeDefined();
      });
    });

    describe('실패 케이스', () => {
      it('제목 없이 생성 시 400을 반환해야 한다', async () => {
        // When & Then
        await testSuite
          .request()
          .post('/api/admin/news')
          .field('description', '제목이 없는 뉴스')
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(400);
      });

      it('categoryId 없이 생성 시 400을 반환해야 한다', async () => {
        // When & Then
        await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', '카테고리가 없는 뉴스')
          .field('description', '카테고리 ID가 없습니다')
          .expect(400);
      });
    });
  });

  describe('PUT /api/admin/news/:id (뉴스 수정)', () => {
    describe('성공 케이스', () => {
      it('뉴스를 수정해야 한다', async () => {
        // Given
        const createResponse = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', '원본 제목')
          .field('description', '원본 설명')
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);

        const newsId = createResponse.body.id;

        // When
        const response = await testSuite
          .request()
          .put(`/api/admin/news/${newsId}`)
          .field('title', '수정된 제목')
          .field('description', '수정된 설명')
          .field('url', 'https://news.example.com/updated')
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174001')
          .expect(200);

        // Then
        expect(response.body).toMatchObject({
          id: newsId,
          title: '수정된 제목',
          description: '수정된 설명',
          url: 'https://news.example.com/updated',
          categoryId: '123e4567-e89b-12d3-a456-426614174001',
        });
        expect(response.body.categoryName).toBeDefined();
      });

      it('기존 파일을 삭제하고 새 파일로 교체해야 한다', async () => {
        // Given - 파일과 함께 뉴스 생성
        const testDir = path.join(__dirname, 'test-files');
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }

        const oldFilePath = path.join(testDir, 'old-file.pdf');
        fs.writeFileSync(oldFilePath, 'old content');

        const createResponse = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', '원본 뉴스')
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .attach('files', oldFilePath)
          .expect(201);

        const newsId = createResponse.body.id;
        const oldFileUrl = createResponse.body.attachments[0].fileUrl;

        // 새 파일 생성
        const newFilePath = path.join(testDir, 'new-file.pdf');
        fs.writeFileSync(newFilePath, 'new content');

        try {
          // When - 새 파일로 수정
          const response = await testSuite
            .request()
            .put(`/api/admin/news/${newsId}`)
            .field('title', '수정된 뉴스')
            .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
            .attach('files', newFilePath)
            .expect(200);

          // Then - 새 파일로 교체됨
          expect(response.body.attachments).toHaveLength(1);
          expect(response.body.attachments[0].fileUrl).not.toBe(oldFileUrl);
        } finally {
          // Cleanup
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
          if (fs.existsSync(newFilePath)) {
            fs.unlinkSync(newFilePath);
          }
          if (fs.existsSync(testDir)) {
            fs.rmdirSync(testDir);
          }
        }
      });

      it('파일만 삭제하고 내용은 유지해야 한다', async () => {
        // Given - 파일과 함께 뉴스 생성
        const testDir = path.join(__dirname, 'test-files');
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }

        const testFilePath = path.join(testDir, 'test-file.pdf');
        fs.writeFileSync(testFilePath, 'test content');

        const createResponse = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', '원본 뉴스')
          .field('description', '원본 설명')
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .attach('files', testFilePath)
          .expect(201);

        const newsId = createResponse.body.id;

        try {
          // When - 파일 없이 수정 (파일만 삭제)
          const response = await testSuite
            .request()
            .put(`/api/admin/news/${newsId}`)
            .field('title', '원본 뉴스')
            .field('description', '원본 설명')
            .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
            .expect(200);

          // Then - 파일이 삭제됨
          expect(response.body.attachments).toEqual([]);
        } finally {
          // Cleanup
          if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
          }
          if (fs.existsSync(testDir)) {
            fs.rmdirSync(testDir);
          }
        }
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID로 뉴스 수정 시 400을 반환해야 한다', async () => {
        // When & Then
        await testSuite
          .request()
          .put('/api/admin/news/non-existent-id')
          .field('title', '수정된 제목')
          .expect(400);
      });

      it('제목 없이 수정 시 400을 반환해야 한다', async () => {
        // Given
        const createResponse = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', '원본 제목')
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);

        const newsId = createResponse.body.id;

        // When & Then
        await testSuite
          .request()
          .put(`/api/admin/news/${newsId}`)
          .field('description', '설명만 수정')
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(400);
      });

      it('categoryId 없이 수정 시 400을 반환해야 한다', async () => {
        // Given
        const createResponse = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', '원본 제목')
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);

        const newsId = createResponse.body.id;

        // When & Then
        await testSuite
          .request()
          .put(`/api/admin/news/${newsId}`)
          .field('title', '수정된 제목')
          .field('description', '수정된 설명')
          .expect(400);
      });
    });
  });

  describe('DELETE /api/admin/news/:id (뉴스 삭제)', () => {
    describe('성공 케이스', () => {
      it('뉴스를 삭제해야 한다', async () => {
        // Given
        const createResponse = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', '삭제될 뉴스')
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .expect(201);

        const newsId = createResponse.body.id;

        // When
        const deleteResponse = await testSuite
          .request()
          .delete(`/api/admin/news/${newsId}`)
          .expect(200);

        // Then
        expect(deleteResponse.body).toMatchObject({
          success: true,
        });

        // 삭제 확인
        await testSuite.request().get(`/api/admin/news/${newsId}`).expect(404);
      });

      it('파일이 있는 뉴스를 삭제해야 한다', async () => {
        // Given - 파일과 함께 뉴스 생성
        const testDir = path.join(__dirname, 'test-files');
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }

        const testFilePath = path.join(testDir, 'test-file.pdf');
        fs.writeFileSync(testFilePath, 'test content');

        const createResponse = await testSuite
          .request()
          .post('/api/admin/news')
          .field('title', '파일이 있는 뉴스')
          .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
          .attach('files', testFilePath)
          .expect(201);

        const newsId = createResponse.body.id;

        try {
          // When
          await testSuite
            .request()
            .delete(`/api/admin/news/${newsId}`)
            .expect(200);

          // Then - 삭제 확인
          await testSuite
            .request()
            .get(`/api/admin/news/${newsId}`)
            .expect(404);
        } finally {
          // Cleanup
          if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
          }
          if (fs.existsSync(testDir)) {
            fs.rmdirSync(testDir);
          }
        }
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID로 뉴스 삭제 시 400을 반환해야 한다', async () => {
        // When & Then
        await testSuite
          .request()
          .delete('/api/admin/news/non-existent-id')
          .expect(400);
      });
    });
  });

  describe('통합 시나리오', () => {
    it('생성 -> 수정 -> 삭제 전체 흐름이 동작해야 한다', async () => {
      // 1. 생성
      const createResponse = await testSuite
        .request()
        .post('/api/admin/news')
        .field('title', '테스트 뉴스')
        .field('description', '테스트 설명')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174000')
        .expect(201);

      const newsId = createResponse.body.id;

      // 2. 조회
      const getResponse = await testSuite
        .request()
        .get(`/api/admin/news/${newsId}`)
        .expect(200);

      expect(getResponse.body.title).toBe('테스트 뉴스');

      // 3. 수정
      const updateResponse = await testSuite
        .request()
        .put(`/api/admin/news/${newsId}`)
        .field('title', '수정된 테스트 뉴스')
        .field('description', '수정된 테스트 설명')
        .field('categoryId', '123e4567-e89b-12d3-a456-426614174001')
        .expect(200);

      expect(updateResponse.body.title).toBe('수정된 테스트 뉴스');

      // 4. 삭제
      await testSuite.request().delete(`/api/admin/news/${newsId}`).expect(200);

      // 5. 삭제 확인
      await testSuite.request().get(`/api/admin/news/${newsId}`).expect(404);
    });
  });
});
