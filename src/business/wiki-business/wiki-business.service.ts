import { Injectable, Logger, Inject } from '@nestjs/common';
import { WikiContextService } from '@context/wiki-context/wiki-context.service';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import type { IStorageService } from '@libs/storage/interfaces/storage.interface';

/**
 * Wiki 비즈니스 서비스
 *
 * Wiki 파일 시스템 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 파일 업로드/삭제 처리
 */
@Injectable()
export class WikiBusinessService {
  private readonly logger = new Logger(WikiBusinessService.name);

  constructor(
    private readonly wikiContextService: WikiContextService,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * 폴더를 조회한다
   */
  async 폴더를_조회한다(id: string): Promise<WikiFileSystem> {
    this.logger.log(`폴더 조회 시작 - ID: ${id}`);

    const wiki = await this.wikiContextService.위키_상세를_조회한다(id);

    this.logger.log(`폴더 조회 완료 - ID: ${id}`);

    return wiki;
  }

  /**
   * 폴더의 하위 항목을 조회한다
   */
  async 폴더_하위_항목을_조회한다(folderId: string): Promise<WikiFileSystem[]> {
    this.logger.log(`폴더 하위 항목 조회 시작 - 폴더 ID: ${folderId}`);

    const children = await this.wikiContextService.폴더_자식들을_조회한다(folderId);

    this.logger.log(`폴더 하위 항목 조회 완료 - 총 ${children.length}개`);

    return children;
  }

  /**
   * 폴더 공개를 수정한다
   */
  async 폴더_공개를_수정한다(
    id: string,
    data: {
      isPublic: boolean;
      permissionRankIds?: string[] | null;
      permissionPositionIds?: string[] | null;
      permissionDepartmentIds?: string[] | null;
      updatedBy?: string;
    },
  ): Promise<WikiFileSystem> {
    this.logger.log(`폴더 공개 수정 시작 - ID: ${id}`);

    const result = await this.wikiContextService.위키_공개를_수정한다(id, data);

    this.logger.log(`폴더 공개 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 폴더를 생성한다
   */
  async 폴더를_생성한다(data: {
    name: string;
    parentId?: string | null;
    isPublic?: boolean;
    permissionRankIds?: string[] | null;
    permissionPositionIds?: string[] | null;
    permissionDepartmentIds?: string[] | null;
    order?: number;
    createdBy?: string;
  }): Promise<WikiFileSystem> {
    this.logger.log(`폴더 생성 시작 - 이름: ${data.name}`);

    const result = await this.wikiContextService.폴더를_생성한다(data);

    const folder = await this.wikiContextService.위키_상세를_조회한다(result.id);

    this.logger.log(`폴더 생성 완료 - ID: ${folder.id}`);

    return folder;
  }

  /**
   * 폴더를 삭제한다 (하위 항목 포함)
   */
  async 폴더를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`폴더 삭제 시작 - ID: ${id}`);

    const result = await this.wikiContextService.위키를_삭제한다(id);

    this.logger.log(`폴더 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 폴더만 삭제한다 (하위 항목이 있으면 실패)
   */
  async 폴더만_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`폴더만 삭제 시작 - ID: ${id}`);

    const result = await this.wikiContextService.폴더만_삭제한다(id);

    this.logger.log(`폴더만 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 폴더를 수정한다
   */
  async 폴더를_수정한다(
    id: string,
    data: {
      name?: string;
      isPublic?: boolean;
      permissionRankIds?: string[] | null;
      permissionPositionIds?: string[] | null;
      permissionDepartmentIds?: string[] | null;
      order?: number;
      updatedBy?: string;
    },
  ): Promise<WikiFileSystem> {
    this.logger.log(`폴더 수정 시작 - ID: ${id}`);

    const result = await this.wikiContextService.위키를_수정한다(id, data);

    this.logger.log(`폴더 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 폴더 경로를 수정한다
   */
  async 폴더_경로를_수정한다(
    id: string,
    data: {
      parentId: string | null;
      updatedBy?: string;
    },
  ): Promise<WikiFileSystem> {
    this.logger.log(`폴더 경로 수정 시작 - ID: ${id}`);

    const result = await this.wikiContextService.위키_경로를_수정한다(id, data);

    this.logger.log(`폴더 경로 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 폴더 이름을 수정한다
   */
  async 폴더_이름을_수정한다(
    id: string,
    data: {
      name: string;
      updatedBy?: string;
    },
  ): Promise<WikiFileSystem> {
    this.logger.log(`폴더 이름 수정 시작 - ID: ${id}`);

    const result = await this.wikiContextService.위키를_수정한다(id, data);

    this.logger.log(`폴더 이름 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 폴더 구조를 가져온다 (모든 하위 항목 포함)
   */
  async 폴더_구조를_가져온다(
    ancestorId?: string,
  ): Promise<WikiFileSystem[]> {
    this.logger.log(`폴더 구조 조회 시작 - 조상 ID: ${ancestorId || '루트 (모든 항목)'}`);

    let result: WikiFileSystem[];

    if (ancestorId) {
      // 특정 폴더의 하위 구조 조회
      const structure = await this.wikiContextService.폴더_구조를_조회한다(
        ancestorId,
      );
      result = structure.map((s) => s.wiki);
    } else {
      // 루트부터 전체 구조 조회 - 모든 wiki 항목 가져오기
      result = await this.wikiContextService.모든_위키를_조회한다();
    }

    this.logger.log(`폴더 구조 조회 완료 - 총 ${result.length}개`);

    return result;
  }

  /**
   * 파일을 삭제한다
   */
  async 파일을_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`파일 삭제 시작 - ID: ${id}`);

    // 1. 파일 정보 조회
    const file = await this.wikiContextService.위키_상세를_조회한다(id);

    // 2. S3에서 파일 삭제
    const filesToDelete: string[] = [];

    if (file.fileUrl) {
      filesToDelete.push(file.fileUrl);
    }

    if (file.attachments && file.attachments.length > 0) {
      filesToDelete.push(...file.attachments.map((a) => a.fileUrl));
    }

    if (filesToDelete.length > 0) {
      this.logger.log(`S3에서 ${filesToDelete.length}개의 파일 삭제 시작`);
      await this.storageService.deleteFiles(filesToDelete);
      this.logger.log(`S3 파일 삭제 완료`);
    }

    // 3. DB에서 삭제
    const result = await this.wikiContextService.위키를_삭제한다(id);

    this.logger.log(`파일 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 파일 경로를 수정한다
   */
  async 파일_경로를_수정한다(
    id: string,
    data: {
      parentId: string | null;
      updatedBy?: string;
    },
  ): Promise<WikiFileSystem> {
    this.logger.log(`파일 경로 수정 시작 - ID: ${id}`);

    const result = await this.wikiContextService.위키_경로를_수정한다(id, data);

    this.logger.log(`파일 경로 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 파일 공개를 수정한다
   */
  async 파일_공개를_수정한다(
    id: string,
    data: {
      isPublic: boolean;
      updatedBy?: string;
    },
  ): Promise<WikiFileSystem> {
    this.logger.log(`파일 공개 수정 시작 - ID: ${id}`);

    const result = await this.wikiContextService.위키를_수정한다(id, {
      isPublic: data.isPublic,
      updatedBy: data.updatedBy,
    });

    this.logger.log(`파일 공개 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 파일들을 조회한다
   */
  async 파일들을_조회한다(parentId: string | null): Promise<WikiFileSystem[]> {
    this.logger.log(
      `파일 목록 조회 시작 - 부모 ID: ${parentId || '루트'}`,
    );

    const result = await this.wikiContextService.폴더_자식들을_조회한다(parentId);

    this.logger.log(`파일 목록 조회 완료 - 총 ${result.length}개`);

    return result;
  }

  /**
   * 파일들을 검색한다
   */
  async 파일들을_검색한다(
    query: string,
  ): Promise<Array<{ wiki: WikiFileSystem; path: Array<{ wiki: WikiFileSystem; depth: number }> }>> {
    this.logger.log(`파일 검색 시작 - 검색어: ${query}`);

    const result = await this.wikiContextService.위키를_검색한다(query);

    this.logger.log(`파일 검색 완료 - 총 ${result.length}개`);

    return result;
  }

  /**
   * 파일을 조회한다
   */
  async 파일을_조회한다(id: string): Promise<WikiFileSystem> {
    this.logger.log(`파일 조회 시작 - ID: ${id}`);

    const result = await this.wikiContextService.위키_상세를_조회한다(id);

    this.logger.log(`파일 조회 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 파일을 생성한다 (업로드 포함)
   */
  async 파일을_생성한다(
    name: string,
    parentId: string | null,
    title: string | null,
    content: string | null,
    createdBy?: string,
    files?: Express.Multer.File[],
    isPublic?: boolean,
  ): Promise<WikiFileSystem> {
    this.logger.log(`파일 생성 시작 - 이름: ${name}`);

    // 파일 업로드 처리
    let attachments:
      | Array<{
          fileName: string;
          fileUrl: string;
          fileSize: number;
          mimeType: string;
        }>
      | undefined = undefined;

    if (files && files.length > 0) {
      this.logger.log(`${files.length}개의 파일 업로드 시작`);
      const uploadedFiles = await this.storageService.uploadFiles(
        files,
        'wiki',
      );
      attachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));
      this.logger.log(`파일 업로드 완료: ${attachments.length}개`);
    }

    const result = await this.wikiContextService.파일을_생성한다({
      name,
      parentId,
      title,
      content,
      attachments,
      isPublic,
      createdBy,
    });

    const file = await this.wikiContextService.위키_상세를_조회한다(result.id);

    this.logger.log(`파일 생성 완료 - ID: ${file.id}`);

    return file;
  }

  /**
   * 빈 파일을 생성한다
   */
  async 빈_파일을_생성한다(
    name: string,
    parentId: string | null,
    createdBy?: string,
    isPublic?: boolean,
  ): Promise<WikiFileSystem> {
    this.logger.log(`빈 파일 생성 시작 - 이름: ${name}`);

    const result = await this.wikiContextService.파일을_생성한다({
      name,
      parentId,
      isPublic,
      createdBy,
    });

    const file = await this.wikiContextService.위키_상세를_조회한다(result.id);

    this.logger.log(`빈 파일 생성 완료 - ID: ${file.id}`);

    return file;
  }

  /**
   * 파일을 수정한다 (업로드 포함)
   */
  async 파일을_수정한다(
    id: string,
    name: string,
    title: string | null,
    content: string | null,
    updatedBy?: string,
    files?: Express.Multer.File[],
  ): Promise<WikiFileSystem> {
    this.logger.log(`파일 수정 시작 - ID: ${id}`);

    // 1. 기존 파일 조회
    const existingFile = await this.wikiContextService.위키_상세를_조회한다(id);

    // 2. 기존 첨부파일 전부 삭제
    const currentAttachments = existingFile.attachments || [];
    if (currentAttachments.length > 0) {
      const filesToDelete = currentAttachments.map((att) => att.fileUrl);
      this.logger.log(
        `S3에서 기존 ${filesToDelete.length}개의 파일 삭제 시작`,
      );
      await this.storageService.deleteFiles(filesToDelete);
      this.logger.log(`S3 파일 삭제 완료`);
    }

    // 3. 새 파일 업로드 처리
    let finalAttachments: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }> = [];

    if (files && files.length > 0) {
      this.logger.log(`${files.length}개의 파일 업로드 시작`);
      const uploadedFiles = await this.storageService.uploadFiles(
        files,
        'wiki',
      );
      finalAttachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));
      this.logger.log(`파일 업로드 완료: ${finalAttachments.length}개`);
    }

    // 4. 파일 정보 업데이트
    await this.wikiContextService.위키_파일을_수정한다(id, {
      attachments: finalAttachments,
      updatedBy,
    });

    // 5. 내용 수정
    const result = await this.wikiContextService.위키를_수정한다(id, {
      name,
      title,
      content,
      updatedBy,
    });

    this.logger.log(`파일 수정 완료 - ID: ${id}`);

    return result;
  }
}
