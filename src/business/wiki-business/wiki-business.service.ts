import { Injectable, Logger, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { WikiContextService } from '@context/wiki-context/wiki-context.service';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { WikiPermissionLog } from '@domain/sub/wiki-file-system/wiki-permission-log.entity';
import { WikiPermissionAction } from '@domain/sub/wiki-file-system/wiki-permission-action.types';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import type { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { ReplaceWikiPermissionsDto } from '@interface/admin/wiki/dto/replace-wiki-permissions.dto';

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
    @InjectRepository(WikiPermissionLog)
    private readonly permissionLogRepository: Repository<WikiPermissionLog>,
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

  /**
   * 위키의 무효한 권한 ID를 새로운 ID로 교체한다
   */
  async 위키_권한을_교체한다(
    wikiId: string,
    dto: ReplaceWikiPermissionsDto,
    userId: string,
  ): Promise<{
    success: boolean;
    message: string;
    replacedDepartments: number;
  }> {
    this.logger.log(`위키 권한 교체 시작 - ID: ${wikiId}`);

    // 위키 조회
    const wiki = await this.wikiContextService.위키_상세를_조회한다(wikiId);

    if (!wiki) {
      throw new NotFoundException('위키를 찾을 수 없습니다');
    }

    let replacedDepartments = 0;
    const changes: string[] = [];

    // 부서 ID 교체
    if (dto.departments && dto.departments.length > 0) {
      const currentDepartmentIds = wiki.permissionDepartmentIds || [];
      const newDepartmentIds = [...currentDepartmentIds];

      for (const mapping of dto.departments) {
        const index = newDepartmentIds.indexOf(mapping.oldId);
        if (index !== -1) {
          newDepartmentIds[index] = mapping.newId;
          replacedDepartments++;
          changes.push(`부서 ${mapping.oldId} → ${mapping.newId}`);
          this.logger.log(`부서 교체: ${mapping.oldId} → ${mapping.newId}`);
        }
      }

      wiki.permissionDepartmentIds = newDepartmentIds;
    }

    // 위키 업데이트
    await this.wikiContextService.위키를_수정한다(wikiId, {
      permissionDepartmentIds: wiki.permissionDepartmentIds,
    });

    // RESOLVED 로그 생성
    // resolvedBy는 UUID 형식이어야 하므로, UUID 형식이 아닌 경우 null로 설정
    let resolvedByValue: string | null = userId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (userId && !uuidRegex.test(userId)) {
      this.logger.warn(`사용자 ID가 UUID 형식이 아닙니다: ${userId}. resolvedBy를 null로 설정합니다.`);
      resolvedByValue = null;
    }

    try {
      await this.permissionLogRepository.save({
        wikiFileSystemId: wiki.id,
        invalidDepartments: null,
        invalidRankCodes: null,
        invalidPositionCodes: null,
        snapshotPermissions: {
          permissionRankIds: wiki.permissionRankIds,
          permissionPositionIds: wiki.permissionPositionIds,
          permissionDepartments: [],
        },
        action: WikiPermissionAction.RESOLVED,
        note: dto.note || `관리자가 권한 교체 완료: ${changes.join(', ')}`,
        detectedAt: new Date(),
        resolvedAt: new Date(),
        resolvedBy: resolvedByValue,
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const pgError = error as any;
        if (pgError.code === '22P02') {
          throw new BadRequestException('유효하지 않은 사용자 ID 형식입니다. UUID 형식이어야 합니다.');
        }
      }
      throw error;
    }

    this.logger.log(`위키 권한 교체 완료 - 부서: ${replacedDepartments}개`);

    return {
      success: true,
      message: '권한 ID가 성공적으로 교체되었습니다',
      replacedDepartments,
    };
  }
}
