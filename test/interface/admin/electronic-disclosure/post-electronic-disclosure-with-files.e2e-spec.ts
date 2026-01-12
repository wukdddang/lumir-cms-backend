import { BaseE2ETest } from '../../../base-e2e.spec';
import { ElectronicDisclosure } from '../../../../src/domain/core/electronic-disclosure/electronic-disclosure.entity';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * 전자공시 파일 업로드 E2E 테스트
 */
describe('[E2E] PATCH /api/admin/electronic-disclosures/:id/files - 파일 업로드', () => {
  let testHelper: BaseE2ETest;
  let testDisclosureId: string;

  // 간단한 PDF 파일 생성
  const createTestPdfBuffer = (content: string): Buffer => {
    const pdfHeader = '%PDF-1.4\n';
    const pdfBody = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000244 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${300 + content.length}\n%%EOF`;
    return Buffer.from(pdfHeader + pdfBody);
  };

  beforeAll(async () => {
    testHelper = new BaseE2ETest();
    await testHelper.initializeApp();

    // 테스트용 전자공시 데이터 직접 생성
    const dataSource = testHelper['dataSource'];
    const disclosure = dataSource.getRepository(ElectronicDisclosure).create({
      title: '파일 테스트용 전자공시',
      content: '파일 업로드 테스트입니다',
      isPublic: false,
      createdBy: 'test-user',
    });
    const saved = await dataSource.getRepository(ElectronicDisclosure).save(disclosure);
    testDisclosureId = saved.id;
  });

  afterAll(async () => {
    // 생성된 전자공시 삭제
    if (testDisclosureId) {
      await testHelper
        .request()
        .delete(`/api/admin/electronic-disclosures/${testDisclosureId}`)
        .expect(200);
    }

    await testHelper.closeApp();
  });

  describe('파일 업로드 테스트', () => {
    it('전자공시에 파일을 업로드할 수 있어야 한다', async () => {
      const fileContent = 'Electronic disclosure test file content';
      const fileName = 'disclosure-test.pdf';
      const pdfBuffer = createTestPdfBuffer(fileContent);

      const response = await testHelper
        .request()
        .patch(`/api/admin/electronic-disclosures/${testDisclosureId}/files`)
        .attach('files', pdfBuffer, { filename: fileName, contentType: 'application/pdf' })
        .expect(200);

      const disclosure: ElectronicDisclosure = response.body;

      // 파일 업로드 확인
      expect(disclosure.attachments).toBeDefined();
      expect(disclosure.attachments.length).toBe(1);

      const attachment = disclosure.attachments[0];
      expect(attachment.fileName).toBe(fileName);
      expect(attachment.fileUrl).toContain('/uploads/electronic-disclosures/');
      expect(attachment.fileSize).toBe(pdfBuffer.length);

      // 로컬 파일 존재 확인
      const urlParts = attachment.fileUrl.split('/uploads/');
      if (urlParts.length === 2) {
        const filePath = join(process.cwd(), 'uploads', urlParts[1]);
        expect(existsSync(filePath)).toBe(true);
      }
    });

    it('전자공시 파일을 삭제할 수 있어야 한다', async () => {
      // 먼저 파일 업로드
      const fileContent = 'File to delete';
      const fileName = 'delete-me.pdf';
      const pdfBuffer = createTestPdfBuffer(fileContent);

      const uploadResponse = await testHelper
        .request()
        .patch(`/api/admin/electronic-disclosures/${testDisclosureId}/files`)
        .attach('files', pdfBuffer, { filename: fileName, contentType: 'application/pdf' })
        .expect(200);

      const fileUrl = uploadResponse.body.attachments.find(
        (a: any) => a.fileName === fileName
      )?.fileUrl;
      expect(fileUrl).toBeDefined();

      // 파일 삭제
      const deleteResponse = await testHelper
        .request()
        .delete(`/api/admin/electronic-disclosures/${testDisclosureId}/files`)
        .send({ fileUrls: [fileUrl] })
        .expect(200);

      // 삭제된 파일이 목록에서 제거되었는지 확인
      const remainingFiles = deleteResponse.body.attachments.filter(
        (a: any) => a.fileUrl === fileUrl
      );
      expect(remainingFiles.length).toBe(0);
    });

    it('여러 파일을 동시에 업로드할 수 있어야 한다', async () => {
      const file1 = { content: 'File 1', name: 'disclosure-1.pdf' };
      const file2 = { content: 'File 2', name: 'disclosure-2.pdf' };
      const file3 = { content: 'File 3', name: 'disclosure-3.pdf' };
      
      const pdf1 = createTestPdfBuffer(file1.content);
      const pdf2 = createTestPdfBuffer(file2.content);
      const pdf3 = createTestPdfBuffer(file3.content);

      const response = await testHelper
        .request()
        .patch(`/api/admin/electronic-disclosures/${testDisclosureId}/files`)
        .attach('files', pdf1, { filename: file1.name, contentType: 'application/pdf' })
        .attach('files', pdf2, { filename: file2.name, contentType: 'application/pdf' })
        .attach('files', pdf3, { filename: file3.name, contentType: 'application/pdf' })
        .expect(200);

      // 이전 파일들 + 새로운 3개 파일
      const newFiles = response.body.attachments.filter((a: any) =>
        [file1.name, file2.name, file3.name].includes(a.fileName)
      );
      expect(newFiles.length).toBe(3);
    });
  });

  describe('파일 검증 테스트', () => {
    it('존재하지 않는 전자공시에는 파일을 업로드할 수 없어야 한다', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const fileContent = 'Test file';
      const pdfBuffer = createTestPdfBuffer(fileContent);

      await testHelper
        .request()
        .patch(`/api/admin/electronic-disclosures/${fakeId}/files`)
        .attach('files', pdfBuffer, { filename: 'test.pdf', contentType: 'application/pdf' })
        .expect(404); // Not Found
    });

    it('빈 파일 배열로 삭제 요청 시 에러가 발생하지 않아야 한다', async () => {
      const response = await testHelper
        .request()
        .delete(`/api/admin/electronic-disclosures/${testDisclosureId}/files`)
        .send({ fileUrls: [] })
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});
