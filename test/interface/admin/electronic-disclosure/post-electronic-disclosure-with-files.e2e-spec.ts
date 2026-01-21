import { BaseE2ETest } from '../../../base-e2e.spec';
import { ElectronicDisclosureResponseDto } from '../../../../src/interface/common/dto/electronic-disclosure/electronic-disclosure-response.dto';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * 전자공시 파일 업로드 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 파일과 함께 전자공시 생성
 * 2. 파일 URL 검증
 * 3. 로컬 스토리지에 파일 존재 확인
 * 4. 파일 추가 업로드
 * 5. 파일 삭제
 */
describe('[E2E] POST /api/admin/electronic-disclosures - 파일 업로드', () => {
  let testHelper: BaseE2ETest;
  let languageId: string;
  let createdDisclosureId: string;

  // 간단한 PDF 파일 생성 (최소 PDF 헤더)
  const createTestPdfBuffer = (content: string): Buffer => {
    const pdfHeader = '%PDF-1.4\n';
    const pdfBody = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000244 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${300 + content.length}\n%%EOF`;
    return Buffer.from(pdfHeader + pdfBody);
  };

  beforeAll(async () => {
    testHelper = new BaseE2ETest();
    await testHelper.beforeAll(); // 기본 언어 초기화 포함

    // 이미 초기화된 한국어 언어를 조회
    const languagesResponse = await testHelper
      .request()
      .get('/api/admin/languages')
      .expect(200);

    const koreanLanguage = languagesResponse.body.items.find(
      (lang: any) => lang.code === 'ko',
    );

    if (!koreanLanguage) {
      throw new Error('한국어 언어를 찾을 수 없습니다.');
    }

    languageId = koreanLanguage.id;
  });

  afterAll(async () => {
    // 생성된 전자공시 삭제
    if (createdDisclosureId) {
      await testHelper
        .request()
        .delete(`/api/admin/electronic-disclosures/${createdDisclosureId}`)
        .expect(200);
    }

    // 언어는 기본 초기화된 것이므로 삭제하지 않음

    await testHelper.afterAll();
  });

  describe('파일 업로드 테스트', () => {
    it('파일과 함께 전자공시를 생성할 수 있어야 한다', async () => {
      // 테스트용 PDF 파일 생성
      const testFileContent = 'This is a test electronic disclosure PDF for E2E testing.';
      const testFileName = 'test-disclosure.pdf';
      const pdfBuffer = createTestPdfBuffer(testFileContent);

      const response = await testHelper
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify([{
          languageId,
          title: '파일 테스트 전자공시',
          description: '파일 업로드 테스트용 전자공시입니다',
        }]))
        .attach('files', pdfBuffer, { filename: testFileName, contentType: 'application/pdf' })
        .expect(201);

      const disclosure = response.body;
      createdDisclosureId = disclosure.id;

      // 전자공시 생성 확인
      expect(disclosure).toBeDefined();
      expect(disclosure.id).toBeDefined();

      // 파일 업로드 확인
      expect(disclosure.attachments).toBeDefined();
      expect(disclosure.attachments.length).toBe(1);
      
      const attachment = disclosure.attachments[0];
      expect(attachment.fileName).toBe(testFileName);
      
      // URL에 환경별 prefix(test)와 폴더(electronic-disclosures)가 포함되어 있는지 확인
      // 로컬 스토리지: http://localhost:4001/uploads/test/electronic-disclosures/uuid.pdf
      // S3 (USE_REAL_S3_IN_TEST=true): https://bucket.s3.region.amazonaws.com/test/electronic-disclosures/uuid.pdf
      expect(attachment.fileUrl).toContain('test/electronic-disclosures/');
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
      const file1Buffer = createTestPdfBuffer('First test PDF');
      const file2Buffer = createTestPdfBuffer('Second test PDF');
      const file1Name = 'test-file-1.pdf';
      const file2Name = 'test-file-2.pdf';

      const response = await testHelper
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify([{
          languageId,
          title: '다중 파일 테스트 전자공시',
          description: '여러 파일 업로드 테스트',
        }]))
        .attach('files', file1Buffer, { filename: file1Name, contentType: 'application/pdf' })
        .attach('files', file2Buffer, { filename: file2Name, contentType: 'application/pdf' })
        .expect(201);

      const disclosure: ElectronicDisclosureResponseDto = response.body;

      // 파일 2개 업로드 확인
      expect(disclosure.attachments).toBeDefined();
      expect(disclosure.attachments).not.toBeNull();
      expect(disclosure.attachments!.length).toBe(2);

      // 각 파일 검증
      const fileNames = disclosure.attachments!.map(a => a.fileName);
      expect(fileNames).toContain(file1Name);
      expect(fileNames).toContain(file2Name);

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/electronic-disclosures/${disclosure.id}`)
        .expect(200);
    });

    it('기존 전자공시에 파일을 추가할 수 있어야 한다', async () => {
      // 먼저 파일 없이 전자공시 생성
      const createResponse = await testHelper
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify([{
          languageId,
          title: '파일 추가 테스트 전자공시',
        }]))
        .expect(201);

      const disclosureId = createResponse.body.id;

      // 파일 업로드 확인 (null 이어야 함)
      expect(createResponse.body.attachments).toBeNull();

      // 파일 추가 - PUT으로 translations와 함께 파일 업데이트
      const pdfBuffer = createTestPdfBuffer('Added PDF content');
      const fileName = 'added-file.pdf';

      const updateResponse = await testHelper
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field('translations', JSON.stringify([{
          languageId,
          title: '파일 추가 테스트 전자공시',
        }]))
        .attach('files', pdfBuffer, { filename: fileName, contentType: 'application/pdf' })
        .expect(200);

      // 파일 추가 확인 - PUT 응답은 ElectronicDisclosureResponseDto 객체를 반환
      expect(updateResponse.body).toBeDefined();
      expect(Array.isArray(updateResponse.body.translations)).toBe(true);
      
      // 전자공시 다시 조회하여 파일 확인
      const getResponse = await testHelper
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      expect(getResponse.body.attachments).toBeDefined();
      expect(getResponse.body.attachments).not.toBeNull();
      expect(getResponse.body.attachments!.length).toBe(1);
      expect(getResponse.body.attachments![0].fileName).toBe(fileName);

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);
    });

    it('전자공시의 파일을 삭제할 수 있어야 한다', async () => {
      // 파일과 함께 전자공시 생성
      const pdfBuffer = createTestPdfBuffer('PDF to be deleted');
      const fileName = 'delete-test.pdf';

      const createResponse = await testHelper
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify([{
          languageId,
          title: '파일 삭제 테스트 전자공시',
        }]))
        .attach('files', pdfBuffer, { filename: fileName, contentType: 'application/pdf' })
        .expect(201);

      const disclosureId = createResponse.body.id;

      // 파일 삭제 - PUT으로 translations만 보내고 files는 보내지 않으면 파일 삭제됨
      await testHelper
        .request()
        .put(`/api/admin/electronic-disclosures/${disclosureId}`)
        .field('translations', JSON.stringify([{
          languageId,
          title: '파일 삭제 테스트 전자공시',
        }]))
        // files를 전송하지 않으면 기존 파일이 모두 삭제됨
        .expect(200);

      // 파일 삭제 확인 - 전자공시 다시 조회
      const getResponse = await testHelper
        .request()
        .get(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);

      // attachments가 null이거나 빈 배열이면 파일이 삭제된 것
      expect(
        getResponse.body.attachments === null || 
        getResponse.body.attachments.length === 0
      ).toBe(true);

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/electronic-disclosures/${disclosureId}`)
        .expect(200);
    });

    it('잘못된 파일 타입은 업로드할 수 없어야 한다', async () => {
      // 실행 파일 등 허용되지 않은 파일 타입
      const executableContent = Buffer.from('fake executable');

      const response = await testHelper
        .request()
        .post('/api/admin/electronic-disclosures')
        .field('translations', JSON.stringify([{
          languageId,
          title: '잘못된 파일 테스트',
        }]))
        .attach('files', executableContent, 'malicious.exe')
        .expect(400); // 클라이언트 검증 에러

      // 에러 메시지 확인
      expect(response.body).toBeDefined();
      expect(response.body.message).toContain('지원하지 않는 파일 형식');
    });
  });
});
