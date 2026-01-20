import { BaseE2ETest } from '../../../base-e2e.spec';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Wiki 파일 업로드 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 첨부파일과 함께 위키 파일 생성
 * 2. 파일 URL 검증 및 로컬 스토리지 존재 확인
 * 3. 여러 첨부파일 동시 업로드
 * 4. 기존 위키 파일에 첨부파일 추가
 * 5. 위키 파일 수정 시 첨부파일 완전 교체
 * 6. 첨부파일 삭제
 * 7. 첨부파일을 포함한 위키 파일 삭제
 */
describe('[E2E] POST /api/admin/wiki/files - 첨부파일 업로드', () => {
  let testHelper: BaseE2ETest;
  let parentFolderId: string;

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
    await testHelper.afterAll();
  });

  beforeEach(async () => {
    await testHelper.cleanupBeforeTest();

    // 테스트용 부모 폴더 생성
    const folderResponse = await testHelper
      .request()
      .post('/api/admin/wiki/folders')
      .send({ name: '첨부파일 테스트 폴더' })
      .expect(201);
    parentFolderId = folderResponse.body.id;
  });

  describe('첨부파일과 함께 위키 파일 생성', () => {
    it('단일 첨부파일과 함께 위키 파일을 생성할 수 있어야 한다', async () => {
      // Given - 테스트용 PDF 파일 생성
      const testFileContent = 'This is a test wiki document PDF for E2E testing.';
      const testFileName = 'test-wiki-document.pdf';
      const pdfBuffer = createTestPdfBuffer(testFileContent);

      // When
      const response = await testHelper
        .request()
        .post('/api/admin/wiki/files')
        .field('name', '첨부파일 테스트 문서')
        .field('title', '테스트 문서 제목')
        .field('content', '이 문서는 첨부파일 업로드 테스트용입니다.')
        .field('parentId', parentFolderId)
        .attach('files', pdfBuffer, {
          filename: testFileName,
          contentType: 'application/pdf',
        })
        .expect(201);

      const file = response.body;

      // Then - 기본 정보 확인
      expect(file).toBeDefined();
      expect(file.id).toBeDefined();
      expect(file.name).toBe('첨부파일 테스트 문서');
      expect(file.title).toBe('테스트 문서 제목');
      expect(file.content).toBe('이 문서는 첨부파일 업로드 테스트용입니다.');
      expect(file.type).toBe('file');
      expect(file.parentId).toBe(parentFolderId);
      expect(file.isPublic).toBe(true);

      // Then - 첨부파일 확인
      expect(file.attachments).toBeDefined();
      expect(file.attachments).not.toBeNull();
      expect(Array.isArray(file.attachments)).toBe(true);
      expect(file.attachments.length).toBe(1);

      const attachment = file.attachments[0];
      expect(attachment.fileName).toBe(testFileName);
      expect(attachment.fileUrl).toContain('/uploads/wiki/');
      expect(attachment.fileSize).toBe(pdfBuffer.length);
      expect(attachment.mimeType).toBe('application/pdf');

      // Then - 로컬 스토리지에 파일이 실제로 존재하는지 확인
      const urlParts = attachment.fileUrl.split('/uploads/');
      if (urlParts.length === 2) {
        const filePath = join(process.cwd(), 'uploads', urlParts[1]);
        const fileExists = existsSync(filePath);
        expect(fileExists).toBe(true);
      }

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/wiki/files/${file.id}`)
        .expect(200);
    });

    it('여러 첨부파일과 함께 위키 파일을 생성할 수 있어야 한다', async () => {
      // Given - 여러 PDF 파일 생성
      const file1Buffer = createTestPdfBuffer('First wiki PDF attachment');
      const file2Buffer = createTestPdfBuffer('Second wiki PDF attachment');
      const file3Buffer = createTestPdfBuffer('Third wiki PDF attachment');
      const file1Name = 'wiki-attachment-1.pdf';
      const file2Name = 'wiki-attachment-2.pdf';
      const file3Name = 'wiki-attachment-3.pdf';

      // When
      const response = await testHelper
        .request()
        .post('/api/admin/wiki/files')
        .field('name', '다중 첨부파일 문서')
        .field('title', '다중 첨부파일 테스트')
        .field('content', '여러 첨부파일을 포함한 문서입니다.')
        .field('parentId', parentFolderId)
        .attach('files', file1Buffer, {
          filename: file1Name,
          contentType: 'application/pdf',
        })
        .attach('files', file2Buffer, {
          filename: file2Name,
          contentType: 'application/pdf',
        })
        .attach('files', file3Buffer, {
          filename: file3Name,
          contentType: 'application/pdf',
        })
        .expect(201);

      const file = response.body;

      // Then - 3개의 첨부파일 확인
      expect(file.attachments).toBeDefined();
      expect(file.attachments).not.toBeNull();
      expect(file.attachments.length).toBe(3);

      // 각 파일명 검증
      const fileNames = file.attachments.map((a: any) => a.fileName);
      expect(fileNames).toContain(file1Name);
      expect(fileNames).toContain(file2Name);
      expect(fileNames).toContain(file3Name);

      // 각 파일의 URL과 크기 검증
      file.attachments.forEach((attachment: any) => {
        expect(attachment.fileUrl).toContain('/uploads/wiki/');
        expect(attachment.fileSize).toBeGreaterThan(0);
        expect(attachment.mimeType).toBe('application/pdf');
      });

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/wiki/files/${file.id}`)
        .expect(200);
    });

    it('첨부파일 없이 위키 파일을 생성할 수 있어야 한다', async () => {
      // When
      const response = await testHelper
        .request()
        .post('/api/admin/wiki/files')
        .field('name', '첨부파일 없는 문서')
        .field('title', '텍스트만 있는 문서')
        .field('content', '이 문서는 첨부파일이 없습니다.')
        .field('parentId', parentFolderId)
        .expect(201);

      const file = response.body;

      // Then - 첨부파일이 없거나 빈 배열이어야 함
      expect(
        file.attachments === null ||
        file.attachments === undefined ||
        (Array.isArray(file.attachments) && file.attachments.length === 0)
      ).toBe(true);

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/wiki/files/${file.id}`)
        .expect(200);
    });

    it('비공개 위키 파일을 첨부파일과 함께 생성할 수 있어야 한다', async () => {
      // Given
      const pdfBuffer = createTestPdfBuffer('Private wiki document');
      const fileName = 'private-document.pdf';

      // When - 먼저 공개 파일로 생성
      const createResponse = await testHelper
        .request()
        .post('/api/admin/wiki/files')
        .field('name', '비공개 문서')
        .field('title', '비공개 테스트')
        .field('content', '비공개 첨부파일 테스트')
        .field('parentId', parentFolderId)
        .attach('files', pdfBuffer, {
          filename: fileName,
          contentType: 'application/pdf',
        })
        .expect(201);

      const file = createResponse.body;

      // 비공개로 변경 (multipart form에서는 boolean을 전송할 수 없으므로 PATCH 사용)
      const updateResponse = await testHelper
        .request()
        .patch(`/api/admin/wiki/files/${file.id}/public`)
        .send({ isPublic: false })
        .expect(200);

      // Then
      expect(updateResponse.body.isPublic).toBe(false);
      expect(updateResponse.body.attachments).toBeDefined();
      expect(updateResponse.body.attachments.length).toBe(1);

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/wiki/files/${file.id}`)
        .expect(200);
    });
  });

  describe('위키 파일 수정 시 첨부파일 관리', () => {
    it('기존 위키 파일에 첨부파일을 추가할 수 있어야 한다', async () => {
      // Given - 먼저 첨부파일 없이 위키 파일 생성
      const createResponse = await testHelper
        .request()
        .post('/api/admin/wiki/files/empty')
        .send({
          name: '첨부파일 추가 테스트',
          parentId: parentFolderId,
        })
        .expect(201);

      const fileId = createResponse.body.id;

      // 첨부파일 없음 확인
      expect(
        createResponse.body.attachments === null ||
        createResponse.body.attachments === undefined ||
        (Array.isArray(createResponse.body.attachments) && createResponse.body.attachments.length === 0)
      ).toBe(true);

      // When - 첨부파일 추가
      const pdfBuffer = createTestPdfBuffer('Added attachment content');
      const fileName = 'added-attachment.pdf';

      const updateResponse = await testHelper
        .request()
        .put(`/api/admin/wiki/files/${fileId}`)
        .field('name', '첨부파일 추가 테스트')
        .field('title', '업데이트된 제목')
        .field('content', '업데이트된 내용')
        .attach('files', pdfBuffer, {
          filename: fileName,
          contentType: 'application/pdf',
        })
        .expect(200);

      // Then - 첨부파일이 추가되었는지 확인
      const file = updateResponse.body;
      expect(file.attachments).toBeDefined();
      expect(file.attachments).not.toBeNull();
      expect(file.attachments.length).toBe(1);
      expect(file.attachments[0].fileName).toBe(fileName);

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/wiki/files/${fileId}`)
        .expect(200);
    });

    it('위키 파일 수정 시 첨부파일을 완전히 교체할 수 있어야 한다', async () => {
      // Given - 첨부파일과 함께 위키 파일 생성
      const oldPdfBuffer = createTestPdfBuffer('Old attachment content');
      const oldFileName = 'old-attachment.pdf';

      const createResponse = await testHelper
        .request()
        .post('/api/admin/wiki/files')
        .field('name', '첨부파일 교체 테스트')
        .field('parentId', parentFolderId)
        .attach('files', oldPdfBuffer, {
          filename: oldFileName,
          contentType: 'application/pdf',
        })
        .expect(201);

      const fileId = createResponse.body.id;
      const oldAttachmentUrl = createResponse.body.attachments[0].fileUrl;

      // 기존 첨부파일 확인
      expect(createResponse.body.attachments.length).toBe(1);
      expect(createResponse.body.attachments[0].fileName).toBe(oldFileName);

      // When - 새 첨부파일로 교체
      const newPdfBuffer = createTestPdfBuffer('New attachment content');
      const newFileName = 'new-attachment.pdf';

      const updateResponse = await testHelper
        .request()
        .put(`/api/admin/wiki/files/${fileId}`)
        .field('name', '첨부파일 교체 테스트')
        .field('title', '교체 완료')
        .attach('files', newPdfBuffer, {
          filename: newFileName,
          contentType: 'application/pdf',
        })
        .expect(200);

      // Then - 새 첨부파일만 남아있어야 함
      const file = updateResponse.body;
      expect(file.attachments).toBeDefined();
      expect(file.attachments.length).toBe(1);
      expect(file.attachments[0].fileName).toBe(newFileName);
      expect(file.attachments[0].fileUrl).not.toBe(oldAttachmentUrl);

      // 기존 파일이 삭제되었는지 확인 (로컬 스토리지)
      const oldUrlParts = oldAttachmentUrl.split('/uploads/');
      if (oldUrlParts.length === 2) {
        const oldFilePath = join(process.cwd(), 'uploads', oldUrlParts[1]);
        const oldFileExists = existsSync(oldFilePath);
        expect(oldFileExists).toBe(false);
      }

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/wiki/files/${fileId}`)
        .expect(200);
    });

    it('위키 파일 수정 시 files를 전송하지 않으면 모든 첨부파일이 삭제되어야 한다', async () => {
      // Given - 첨부파일과 함께 위키 파일 생성
      const pdfBuffer = createTestPdfBuffer('To be deleted');
      const fileName = 'delete-test.pdf';

      const createResponse = await testHelper
        .request()
        .post('/api/admin/wiki/files')
        .field('name', '첨부파일 삭제 테스트')
        .field('parentId', parentFolderId)
        .attach('files', pdfBuffer, {
          filename: fileName,
          contentType: 'application/pdf',
        })
        .expect(201);

      const fileId = createResponse.body.id;
      const attachmentUrl = createResponse.body.attachments[0].fileUrl;

      // When - files를 전송하지 않고 수정
      const updateResponse = await testHelper
        .request()
        .put(`/api/admin/wiki/files/${fileId}`)
        .field('name', '첨부파일 삭제 테스트')
        .field('title', '첨부파일 제거됨')
        .field('content', '첨부파일이 모두 삭제되었습니다.')
        // files를 전송하지 않음
        .expect(200);

      // Then - 첨부파일이 없어야 함
      const file = updateResponse.body;
      expect(
        file.attachments === null ||
        file.attachments === undefined ||
        (Array.isArray(file.attachments) && file.attachments.length === 0)
      ).toBe(true);

      // 기존 파일이 삭제되었는지 확인 (로컬 스토리지)
      const urlParts = attachmentUrl.split('/uploads/');
      if (urlParts.length === 2) {
        const filePath = join(process.cwd(), 'uploads', urlParts[1]);
        const fileExists = existsSync(filePath);
        expect(fileExists).toBe(false);
      }

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/wiki/files/${fileId}`)
        .expect(200);
    });

    it('여러 첨부파일을 다른 여러 첨부파일로 교체할 수 있어야 한다', async () => {
      // Given - 2개의 첨부파일과 함께 생성
      const old1 = createTestPdfBuffer('Old file 1');
      const old2 = createTestPdfBuffer('Old file 2');

      const createResponse = await testHelper
        .request()
        .post('/api/admin/wiki/files')
        .field('name', '다중 첨부파일 교체 테스트')
        .field('parentId', parentFolderId)
        .attach('files', old1, { filename: 'old-1.pdf', contentType: 'application/pdf' })
        .attach('files', old2, { filename: 'old-2.pdf', contentType: 'application/pdf' })
        .expect(201);

      const fileId = createResponse.body.id;
      expect(createResponse.body.attachments.length).toBe(2);

      // When - 3개의 새 첨부파일로 교체
      const new1 = createTestPdfBuffer('New file 1');
      const new2 = createTestPdfBuffer('New file 2');
      const new3 = createTestPdfBuffer('New file 3');

      const updateResponse = await testHelper
        .request()
        .put(`/api/admin/wiki/files/${fileId}`)
        .field('name', '다중 첨부파일 교체 테스트')
        .attach('files', new1, { filename: 'new-1.pdf', contentType: 'application/pdf' })
        .attach('files', new2, { filename: 'new-2.pdf', contentType: 'application/pdf' })
        .attach('files', new3, { filename: 'new-3.pdf', contentType: 'application/pdf' })
        .expect(200);

      // Then - 3개의 새 파일만 있어야 함
      const file = updateResponse.body;
      expect(file.attachments.length).toBe(3);

      const newFileNames = file.attachments.map((a: any) => a.fileName);
      expect(newFileNames).toContain('new-1.pdf');
      expect(newFileNames).toContain('new-2.pdf');
      expect(newFileNames).toContain('new-3.pdf');
      expect(newFileNames).not.toContain('old-1.pdf');
      expect(newFileNames).not.toContain('old-2.pdf');

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/wiki/files/${fileId}`)
        .expect(200);
    });
  });

  describe('첨부파일을 포함한 위키 파일 삭제', () => {
    it('위키 파일 삭제 시 첨부파일도 함께 삭제되어야 한다', async () => {
      // Given - 첨부파일과 함께 위키 파일 생성
      const pdfBuffer = createTestPdfBuffer('File to be deleted with wiki');
      const fileName = 'file-with-wiki-delete.pdf';

      const createResponse = await testHelper
        .request()
        .post('/api/admin/wiki/files')
        .field('name', '삭제 테스트 문서')
        .field('parentId', parentFolderId)
        .attach('files', pdfBuffer, {
          filename: fileName,
          contentType: 'application/pdf',
        })
        .expect(201);

      const fileId = createResponse.body.id;
      const attachmentUrl = createResponse.body.attachments[0].fileUrl;

      // 첨부파일이 로컬 스토리지에 존재하는지 확인
      const urlParts = attachmentUrl.split('/uploads/');
      const filePath = join(process.cwd(), 'uploads', urlParts[1]);
      expect(existsSync(filePath)).toBe(true);

      // When - 위키 파일 삭제
      await testHelper
        .request()
        .delete(`/api/admin/wiki/files/${fileId}`)
        .expect(200);

      // Then - 위키 파일이 삭제되었는지 확인
      await testHelper
        .request()
        .get(`/api/admin/wiki/files/${fileId}`)
        .expect(404);

      // 첨부파일도 삭제되었는지 확인
      const fileExists = existsSync(filePath);
      expect(fileExists).toBe(false);
    });

    it('여러 첨부파일을 가진 위키 파일 삭제 시 모든 첨부파일이 삭제되어야 한다', async () => {
      // Given - 여러 첨부파일과 함께 생성
      const pdf1 = createTestPdfBuffer('Multiple files 1');
      const pdf2 = createTestPdfBuffer('Multiple files 2');
      const pdf3 = createTestPdfBuffer('Multiple files 3');

      const createResponse = await testHelper
        .request()
        .post('/api/admin/wiki/files')
        .field('name', '다중 첨부파일 삭제 테스트')
        .field('parentId', parentFolderId)
        .attach('files', pdf1, { filename: 'multi-1.pdf', contentType: 'application/pdf' })
        .attach('files', pdf2, { filename: 'multi-2.pdf', contentType: 'application/pdf' })
        .attach('files', pdf3, { filename: 'multi-3.pdf', contentType: 'application/pdf' })
        .expect(201);

      const fileId = createResponse.body.id;
      const attachmentUrls = createResponse.body.attachments.map((a: any) => a.fileUrl);

      // 모든 첨부파일이 존재하는지 확인
      const filePaths = attachmentUrls.map((url: string) => {
        const urlParts = url.split('/uploads/');
        return join(process.cwd(), 'uploads', urlParts[1]);
      });

      filePaths.forEach((path: string) => {
        expect(existsSync(path)).toBe(true);
      });

      // When - 위키 파일 삭제
      await testHelper
        .request()
        .delete(`/api/admin/wiki/files/${fileId}`)
        .expect(200);

      // Then - 모든 첨부파일이 삭제되었는지 확인
      filePaths.forEach((path: string) => {
        expect(existsSync(path)).toBe(false);
      });
    });
  });

  describe('첨부파일 검증', () => {
    it('name이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const pdfBuffer = createTestPdfBuffer('Test content');

      // When & Then
      await testHelper
        .request()
        .post('/api/admin/wiki/files')
        // name 필드 누락
        .field('title', '제목만 있음')
        .attach('files', pdfBuffer, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);
    });

    it('존재하지 않는 parentId로 위키 파일을 생성하면 400 에러가 발생해야 한다', async () => {
      // Given
      const pdfBuffer = createTestPdfBuffer('Test content');
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await testHelper
        .request()
        .post('/api/admin/wiki/files')
        .field('name', '잘못된 부모 ID')
        .field('parentId', nonExistentId)
        .attach('files', pdfBuffer, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);
    });

    it('첨부파일 정보가 attachments 필드에 올바르게 저장되어야 한다', async () => {
      // Given
      const pdfBuffer = createTestPdfBuffer('Attachment metadata test');
      const fileName = 'metadata-test.pdf';

      // When
      const response = await testHelper
        .request()
        .post('/api/admin/wiki/files')
        .field('name', '메타데이터 테스트')
        .field('parentId', parentFolderId)
        .attach('files', pdfBuffer, {
          filename: fileName,
          contentType: 'application/pdf',
        })
        .expect(201);

      // Then - attachments 구조 검증
      const attachment = response.body.attachments[0];
      expect(attachment).toHaveProperty('fileName');
      expect(attachment).toHaveProperty('fileUrl');
      expect(attachment).toHaveProperty('fileSize');
      expect(attachment).toHaveProperty('mimeType');
      
      expect(typeof attachment.fileName).toBe('string');
      expect(typeof attachment.fileUrl).toBe('string');
      expect(typeof attachment.fileSize).toBe('number');
      expect(typeof attachment.mimeType).toBe('string');

      // 정리
      await testHelper
        .request()
        .delete(`/api/admin/wiki/files/${response.body.id}`)
        .expect(200);
    });
  });
});
