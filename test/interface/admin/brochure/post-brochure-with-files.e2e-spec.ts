import { BaseE2ETest } from '../../../base-e2e.spec';
import { BrochureResponseDto } from '../../../../src/interface/common/dto/brochure/brochure-response.dto';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * 브로슈어 파일 업로드 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 파일과 함께 브로슈어 생성
 * 2. 파일 URL 검증
 * 3. 로컬 스토리지에 파일 존재 확인
 * 4. 파일 추가 업로드
 * 5. 파일 삭제
 */
describe('[E2E] POST /api/admin/brochures - 파일 업로드', () => {
  let testHelper: BaseE2ETest;
  let languageId: string;
  let createdBrochureId: string;

  // 간단한 PDF 파일 생성 (최소 PDF 헤더)
  const createTestPdfBuffer = (content: string): Buffer => {
    const pdfHeader = '%PDF-1.4\n';
    const pdfBody = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000244 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${300 + content.length}\n%%EOF`;
    return Buffer.from(pdfHeader + pdfBody);
  };

  beforeAll(async () => {
    testHelper = new BaseE2ETest();
    await testHelper.initializeApp();

    // 테스트용 언어 생성
    const languageResponse = await testHelper
      .request()
      .post('/api/admin/languages')
      .send({
        code: 'ko',
        name: '한국어',
        nativeName: '한국어',
        isActive: true,
      })
      .expect(201);

    languageId = languageResponse.body.id;
  });

  afterAll(async () => {
    // 생성된 브로슈어 삭제
    if (createdBrochureId) {
      await testHelper
        .request()
        .delete(`/api/admin/brochures/${createdBrochureId}`)
        .expect(200);
    }

    // 생성된 언어 삭제
    if (languageId) {
      await testHelper
        .request()
        .delete(`/api/admin/languages/${languageId}`)
        .expect(200);
    }

    await testHelper.closeApp();
  });

  describe('파일 업로드 테스트', () => {
    it('파일과 함께 브로슈어를 생성할 수 있어야 한다', async () => {
      // 테스트용 PDF 파일 생성
      const testFileContent = 'This is a test brochure PDF for E2E testing.';
      const testFileName = 'test-brochure.pdf';
      const pdfBuffer = createTestPdfBuffer(testFileContent);

      const response = await testHelper
        .request()
        .post('/api/admin/brochures')
        .field('translations', JSON.stringify([{
          languageId,
          title: '파일 테스트 브로슈어',
          description: '파일 업로드 테스트용 브로슈어입니다',
        }]))
        .attach('files', pdfBuffer, { filename: testFileName, contentType: 'application/pdf' })
        .expect(201);

      const brochure = response.body;
      createdBrochureId = brochure.id;

      // 브로슈어 생성 확인
      expect(brochure).toBeDefined();
      expect(brochure.id).toBeDefined();

      // 파일 업로드 확인
      expect(brochure.attachments).toBeDefined();
      expect(brochure.attachments.length).toBe(1);
      
      const attachment = brochure.attachments[0];
      expect(attachment.fileName).toBe(testFileName);
      expect(attachment.fileUrl).toContain('/uploads/brochures/');
      expect(attachment.fileSize).toBe(pdfBuffer.length);
      expect(attachment.mimeType).toBe('application/pdf');

      // 로컬 스토리지에 파일이 실제로 존재하는지 확인
      const urlParts = attachment.fileUrl.split('/uploads/');
      if (urlParts.length === 2) {
        const filePath = join(process.cwd(), 'uploads', urlParts[1]);
        const fileExists = existsSync(filePath);
        expect(fileExists).toBe(true);
      }
    });

    it('여러 파일을 동시에 업로드할 수 있어야 한다', async () => {
      const file1Buffer = createTestPdfBuffer('First test PDF');
      const file2Buffer = createTestPdfBuffer('Second test PDF');
      const file1Name = 'test-file-1.pdf';
      const file2Name = 'test-file-2.pdf';

      const response = await testHelper
        .request()
        .post('/api/admin/brochures')
        .field('translations', JSON.stringify([{
          languageId,
          title: '다중 파일 테스트 브로슈어',
          description: '여러 파일 업로드 테스트',
        }]))
        .attach('files', file1Buffer, { filename: file1Name, contentType: 'application/pdf' })
        .attach('files', file2Buffer, { filename: file2Name, contentType: 'application/pdf' })
        .expect(201);

      const brochure: BrochureResponseDto = response.body;

      // 파일 2개 업로드 확인
      expect(brochure.attachments).toBeDefined();
      expect(brochure.attachments.length).toBe(2);

      // 각 파일 검증
      const fileNames = brochure.attachments.map(a => a.fileName);
      expect(fileNames).toContain(file1Name);
      expect(fileNames).toContain(file2Name);

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/brochures/${brochure.id}`)
        .expect(200);
    });

    it('기존 브로슈어에 파일을 추가할 수 있어야 한다', async () => {
      // 먼저 파일 없이 브로슈어 생성
      const createResponse = await testHelper
        .request()
        .post('/api/admin/brochures')
        .field('translations', JSON.stringify([{
          languageId,
          title: '파일 추가 테스트 브로슈어',
        }]))
        .expect(201);

      const brochureId = createResponse.body.id;

      // 파일 업로드 확인 (null 이어야 함)
      expect(createResponse.body.attachments).toBeNull();

      // 파일 추가
      const pdfBuffer = createTestPdfBuffer('Added PDF content');
      const fileName = 'added-file.pdf';

      const updateResponse = await testHelper
        .request()
        .patch(`/api/admin/brochures/${brochureId}/files`)
        .attach('files', pdfBuffer, { filename: fileName, contentType: 'application/pdf' })
        .expect(200);

      // 파일 추가 확인
      expect(updateResponse.body.attachments).toBeDefined();
      expect(updateResponse.body.attachments.length).toBe(1);
      expect(updateResponse.body.attachments[0].fileName).toBe(fileName);

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/brochures/${brochureId}`)
        .expect(200);
    });

    it('브로슈어의 파일을 삭제할 수 있어야 한다', async () => {
      // 파일과 함께 브로슈어 생성
      const pdfBuffer = createTestPdfBuffer('PDF to be deleted');
      const fileName = 'delete-test.pdf';

      const createResponse = await testHelper
        .request()
        .post('/api/admin/brochures')
        .field('translations', JSON.stringify([{
          languageId,
          title: '파일 삭제 테스트 브로슈어',
        }]))
        .attach('files', pdfBuffer, { filename: fileName, contentType: 'application/pdf' })
        .expect(201);

      const brochureId = createResponse.body.id;
      const fileUrl = createResponse.body.attachments[0].fileUrl;

      // 파일 삭제
      const deleteResponse = await testHelper
        .request()
        .delete(`/api/admin/brochures/${brochureId}/files`)
        .send({ fileUrls: [fileUrl] })
        .expect(200);

      // 파일 삭제 확인
      expect(deleteResponse.body.attachments).toEqual([]);

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/brochures/${brochureId}`)
        .expect(200);
    });

    it('잘못된 파일 타입은 업로드할 수 없어야 한다', async () => {
      // 실행 파일 등 허용되지 않은 파일 타입
      const executableContent = Buffer.from('fake executable');

      const response = await testHelper
        .request()
        .post('/api/admin/brochures')
        .field('translations', JSON.stringify([{
          languageId,
          title: '잘못된 파일 테스트',
        }]))
        .attach('files', executableContent, 'malicious.exe')
        .expect(500); // 파일 필터 에러

      // 에러가 발생했는지 확인
      expect(response.body).toBeDefined();
    });
  });
});
