import { BaseE2ETest } from '../../../base-e2e.spec';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * 루미르스토리 파일 업로드 E2E 테스트
 *
 * 테스트 시나리오:
 * 1. 파일과 함께 루미르스토리 생성
 * 2. 파일 URL 검증
 * 3. 로컬 스토리지에 파일 존재 확인
 * 4. 파일 추가 업로드
 * 5. 파일 삭제
 */
describe('[E2E] POST /api/admin/lumir-stories - 파일 업로드', () => {
  let testHelper: BaseE2ETest;
  let createdLumirStoryId: string;

  // 간단한 PDF 파일 생성 (최소 PDF 헤더)
  const createTestPdfBuffer = (content: string): Buffer => {
    const pdfHeader = '%PDF-1.4\n';
    const pdfBody = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000244 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${300 + content.length}\n%%EOF`;
    return Buffer.from(pdfHeader + pdfBody);
  };

  beforeAll(async () => {
    testHelper = new BaseE2ETest();
    await testHelper.beforeAll();
  });

  afterAll(async () => {
    // 생성된 루미르스토리 삭제
    if (createdLumirStoryId) {
      await testHelper
        .request()
        .delete(`/api/admin/lumir-stories/${createdLumirStoryId}`)
        .expect(200);
    }

    await testHelper.afterAll();
  });

  describe('파일 업로드 테스트', () => {
    it('파일과 함께 루미르스토리를 생성할 수 있어야 한다', async () => {
      // 카테고리 먼저 생성
      const categoryResponse = await testHelper
        .request()
        .post('/api/admin/lumir-stories/categories')
        .send({
          name: '파일 테스트',
          description: '파일 테스트 카테고리',
        })
        .expect(201);

      const categoryId = categoryResponse.body.id;

      // 테스트용 PDF 파일 생성
      const testFileContent = 'This is a test lumir story PDF for E2E testing.';
      const testFileName = 'test-lumir-story.pdf';
      const pdfBuffer = createTestPdfBuffer(testFileContent);

      const response = await testHelper
        .request()
        .post('/api/admin/lumir-stories')
        .field('title', '파일 테스트 루미르 스토리')
        .field('content', '파일 업로드 테스트용 루미르스토리입니다')
        .field('categoryId', categoryId)
        .attach('files', pdfBuffer, {
          filename: testFileName,
          contentType: 'application/pdf',
        })
        .expect(201);

      const lumirStory = response.body;
      createdLumirStoryId = lumirStory.id;

      // 루미르스토리 생성 확인
      expect(lumirStory).toBeDefined();
      expect(lumirStory.id).toBeDefined();
      expect(lumirStory.categoryId).toBe(categoryId);

      // 파일 업로드 확인
      expect(lumirStory.attachments).toBeDefined();
      expect(lumirStory.attachments).not.toBeNull();
      expect(lumirStory.attachments.length).toBe(1);

      const attachment = lumirStory.attachments[0];
      expect(attachment.fileName).toBe(testFileName);
      
      // URL에 환경별 prefix(test)와 폴더(lumir-stories)가 포함되어 있는지 확인
      // 로컬 스토리지: http://localhost:4001/uploads/test/lumir-stories/uuid.pdf
      // S3 (USE_REAL_S3_IN_TEST=true): https://bucket.s3.region.amazonaws.com/test/lumir-stories/uuid.pdf
      expect(attachment.fileUrl).toContain('test/lumir-stories/');
      expect(attachment.fileUrl).toMatch(/\.pdf$/); // .pdf로 끝나는지 확인
      
      expect(attachment.fileSize).toBe(pdfBuffer.length);
      expect(attachment.mimeType).toBe('application/pdf');

      // 로컬 스토리지 사용 시에만 파일 존재 확인
      // S3 사용 시에는 파일 존재 확인을 스킵 (S3 API 호출 비용 절약)
      if (attachment.fileUrl.includes('localhost')) {
        const urlParts = attachment.fileUrl.split('/uploads/');
        if (urlParts.length === 2) {
          const filePath = join(process.cwd(), 'uploads', urlParts[1]);
          const fileExists = existsSync(filePath);
          expect(fileExists).toBe(true);
        }
      }
    });

    it('여러 파일을 동시에 업로드할 수 있어야 한다', async () => {
      // 카테고리 먼저 생성
      const categoryResponse = await testHelper
        .request()
        .post('/api/admin/lumir-stories/categories')
        .send({
          name: '다중 파일',
          description: '다중 파일 카테고리',
        })
        .expect(201);

      const categoryId = categoryResponse.body.id;

      const file1Buffer = createTestPdfBuffer('First test PDF');
      const file2Buffer = createTestPdfBuffer('Second test PDF');
      const file1Name = 'test-file-1.pdf';
      const file2Name = 'test-file-2.pdf';

      const response = await testHelper
        .request()
        .post('/api/admin/lumir-stories')
        .field('title', '다중 파일 테스트 루미르 스토리')
        .field('content', '여러 파일 업로드 테스트')
        .field('categoryId', categoryId)
        .attach('files', file1Buffer, {
          filename: file1Name,
          contentType: 'application/pdf',
        })
        .attach('files', file2Buffer, {
          filename: file2Name,
          contentType: 'application/pdf',
        })
        .expect(201);

      const lumirStory = response.body;

      // 파일 2개 업로드 확인
      expect(lumirStory.attachments).toBeDefined();
      expect(lumirStory.attachments).not.toBeNull();
      expect(lumirStory.attachments.length).toBe(2);

      // 각 파일 검증
      const fileNames = lumirStory.attachments.map((a: any) => a.fileName);
      expect(fileNames).toContain(file1Name);
      expect(fileNames).toContain(file2Name);

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/lumir-stories/${lumirStory.id}`)
        .expect(200);
    });

    it('기존 루미르스토리에 파일을 추가할 수 있어야 한다', async () => {
      // 카테고리 먼저 생성
      const categoryResponse = await testHelper
        .request()
        .post('/api/admin/lumir-stories/categories')
        .send({
          name: '파일 추가',
          description: '파일 추가 카테고리',
        })
        .expect(201);

      const categoryId = categoryResponse.body.id;

      // 먼저 파일 없이 루미르스토리 생성
      const createResponse = await testHelper
        .request()
        .post('/api/admin/lumir-stories')
        .send({
          title: '파일 추가 테스트',
          content: '파일 추가 테스트 내용',
          categoryId,
        });

      const lumirStoryId = createResponse.body.id;

      // 파일 추가
      const fileBuffer = createTestPdfBuffer('Added file content');
      const fileName = 'added-file.pdf';

      const updateResponse = await testHelper
        .request()
        .put(`/api/admin/lumir-stories/${lumirStoryId}`)
        .field('title', '파일 추가 테스트')
        .field('content', '파일 추가 테스트 내용')
        .field('categoryId', categoryId)
        .attach('files', fileBuffer, {
          filename: fileName,
          contentType: 'application/pdf',
        })
        .expect(200);

      // 파일이 추가되었는지 확인
      const detailResponse = await testHelper
        .request()
        .get(`/api/admin/lumir-stories/${lumirStoryId}`)
        .expect(200);

      expect(detailResponse.body.attachments).toBeDefined();
      expect(detailResponse.body.attachments).not.toBeNull();
      expect(detailResponse.body.attachments.length).toBe(1);
      expect(detailResponse.body.attachments[0].fileName).toBe(fileName);

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/lumir-stories/${lumirStoryId}`)
        .expect(200);
    });
  });
});
