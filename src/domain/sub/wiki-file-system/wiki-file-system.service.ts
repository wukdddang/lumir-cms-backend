import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { WikiFileSystem } from './wiki-file-system.entity';
import { WikiFileSystemClosure } from './wiki-file-system-closure.entity';
import { WikiFileSystemType } from './wiki-file-system-type.types';

/**
 * WikiFileSystem 도메인 서비스
 *
 * 위키 파일 시스템 엔티티의 생성, 조회, 수정, 삭제를 담당합니다.
 */
@Injectable()
export class WikiFileSystemService {
  private readonly logger = new Logger(WikiFileSystemService.name);

  constructor(
    @InjectRepository(WikiFileSystem)
    private readonly wikiRepository: Repository<WikiFileSystem>,
    @InjectRepository(WikiFileSystemClosure)
    private readonly closureRepository: Repository<WikiFileSystemClosure>,
  ) {}

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

    const folder = this.wikiRepository.create({
      name: data.name,
      type: WikiFileSystemType.FOLDER,
      parentId: data.parentId || null,
      isPublic: data.isPublic ?? true,
      permissionRankIds: data.permissionRankIds || null,
      permissionPositionIds: data.permissionPositionIds || null,
      permissionDepartmentIds: data.permissionDepartmentIds || null,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    const saved = await this.wikiRepository.save(folder);
    this.logger.log(`폴더 생성 완료 - ID: ${saved.id}`);

    return saved;
  }

  /**
   * 파일을 생성한다
   */
  async 파일을_생성한다(data: {
    name: string;
    parentId?: string | null;
    title?: string | null;
    content?: string | null;
    fileUrl?: string | null;
    fileSize?: number | null;
    mimeType?: string | null;
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }> | null;
    isPublic?: boolean;
    order?: number;
    createdBy?: string;
  }): Promise<WikiFileSystem> {
    this.logger.log(`파일 생성 시작 - 이름: ${data.name}`);

    const file = this.wikiRepository.create({
      name: data.name,
      type: WikiFileSystemType.FILE,
      parentId: data.parentId || null,
      title: data.title || null,
      content: data.content || null,
      fileUrl: data.fileUrl || null,
      fileSize: data.fileSize || null,
      mimeType: data.mimeType || null,
      attachments: data.attachments || null,
      // 파일의 isPublic 설정 (기본값: true - 상위 폴더 cascading)
      isPublic: data.isPublic ?? true,
      // 파일은 나머지 권한 필드 사용 안함
      permissionRankIds: null,
      permissionPositionIds: null,
      permissionDepartmentIds: null,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    const saved = await this.wikiRepository.save(file);
    this.logger.log(`파일 생성 완료 - ID: ${saved.id}`);

    return saved;
  }

  /**
   * ID로 조회한다
   */
  async ID로_조회한다(id: string): Promise<WikiFileSystem> {
    const wiki = await this.wikiRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!wiki) {
      throw new NotFoundException(`Wiki not found - ID: ${id}`);
    }

    return wiki;
  }

  /**
   * 루트 폴더 목록을 조회한다
   */
  async 루트_폴더_목록을_조회한다(): Promise<WikiFileSystem[]> {
    return await this.wikiRepository.find({
      where: {
        parentId: IsNull(),
        deletedAt: IsNull(),
      },
      order: {
        type: 'DESC', // folder 먼저
        order: 'ASC',
        name: 'ASC',
      },
    });
  }

  /**
   * 부모 ID로 자식 목록을 조회한다
   */
  async 부모_ID로_자식_목록을_조회한다(
    parentId: string,
  ): Promise<WikiFileSystem[]> {
    return await this.wikiRepository.find({
      where: {
        parentId,
        deletedAt: IsNull(),
      },
      order: {
        type: 'DESC', // folder 먼저
        order: 'ASC',
        name: 'ASC',
      },
    });
  }

  /**
   * 폴더 구조를 조회한다 (Closure Table 사용)
   */
  async 폴더_구조를_조회한다(
    ancestorId: string,
  ): Promise<{ wiki: WikiFileSystem; depth: number }[]> {
    const closures = await this.closureRepository.find({
      where: {
        ancestor: ancestorId,
      },
      relations: ['descendantNode'],
      order: {
        depth: 'ASC',
      },
    });

    return closures
      .filter((c) => c.descendantNode && !c.descendantNode.deletedAt)
      .map((c) => ({
        wiki: c.descendantNode,
        depth: c.depth,
      }));
  }

  /**
   * 상위 경로를 조회한다 (Breadcrumb용)
   */
  async 상위_경로를_조회한다(
    descendantId: string,
  ): Promise<{ wiki: WikiFileSystem; depth: number }[]> {
    const closures = await this.closureRepository.find({
      where: {
        descendant: descendantId,
      },
      relations: ['ancestorNode'],
      order: {
        depth: 'DESC',
      },
    });

    return closures
      .filter((c) => c.ancestorNode && !c.ancestorNode.deletedAt)
      .map((c) => ({
        wiki: c.ancestorNode,
        depth: c.depth,
      }));
  }

  /**
   * 모든 위키를 조회한다 (폴더 구조 트리용)
   */
  async 모든_위키를_조회한다(): Promise<WikiFileSystem[]> {
    this.logger.log('모든 위키 조회 시작');

    const wikis = await this.wikiRepository.find({
      order: {
        depth: 'ASC',
        order: 'ASC',
        createdAt: 'ASC',
      },
    });

    this.logger.log(`모든 위키 조회 완료 - 총 ${wikis.length}개`);

    return wikis;
  }

  /**
   * 위키를 수정한다
   */
  async 위키를_수정한다(
    id: string,
    data: {
      name?: string;
      title?: string | null;
      content?: string | null;
      fileUrl?: string | null;
      fileSize?: number | null;
      mimeType?: string | null;
      attachments?: Array<{
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
      }> | null;
      isPublic?: boolean;
      permissionRankIds?: string[] | null;
      permissionPositionIds?: string[] | null;
      permissionDepartmentIds?: string[] | null;
      order?: number;
      updatedBy?: string;
    },
  ): Promise<WikiFileSystem> {
    const wiki = await this.ID로_조회한다(id);

    if (data.name !== undefined) wiki.name = data.name;
    if (data.title !== undefined) wiki.title = data.title;
    if (data.content !== undefined) wiki.content = data.content;
    if (data.fileUrl !== undefined) wiki.fileUrl = data.fileUrl;
    if (data.fileSize !== undefined) wiki.fileSize = data.fileSize;
    if (data.mimeType !== undefined) wiki.mimeType = data.mimeType;
    if (data.attachments !== undefined) wiki.attachments = data.attachments;
    if (data.isPublic !== undefined) wiki.isPublic = data.isPublic;
    if (data.permissionRankIds !== undefined)
      wiki.permissionRankIds = data.permissionRankIds;
    if (data.permissionPositionIds !== undefined)
      wiki.permissionPositionIds = data.permissionPositionIds;
    if (data.permissionDepartmentIds !== undefined)
      wiki.permissionDepartmentIds = data.permissionDepartmentIds;
    if (data.order !== undefined) wiki.order = data.order;
    if (data.updatedBy) wiki.updatedBy = data.updatedBy;

    return await this.wikiRepository.save(wiki);
  }

  /**
   * 공개를 수정한다
   */
  async 공개를_수정한다(
    id: string,
    data: {
      isPublic: boolean;
      permissionRankIds?: string[] | null;
      permissionPositionIds?: string[] | null;
      permissionDepartmentIds?: string[] | null;
      updatedBy?: string;
    },
  ): Promise<WikiFileSystem> {
    const wiki = await this.ID로_조회한다(id);

    wiki.isPublic = data.isPublic;
    if (data.permissionRankIds !== undefined)
      wiki.permissionRankIds = data.permissionRankIds;
    if (data.permissionPositionIds !== undefined)
      wiki.permissionPositionIds = data.permissionPositionIds;
    if (data.permissionDepartmentIds !== undefined)
      wiki.permissionDepartmentIds = data.permissionDepartmentIds;
    if (data.updatedBy) wiki.updatedBy = data.updatedBy;

    return await this.wikiRepository.save(wiki);
  }

  /**
   * 경로를 수정한다 (부모 변경)
   */
  async 경로를_수정한다(
    id: string,
    data: {
      parentId: string | null;
      updatedBy?: string;
    },
  ): Promise<WikiFileSystem> {
    const wiki = await this.ID로_조회한다(id);

    // 순환 참조 체크
    if (data.parentId) {
      const descendants = await this.폴더_구조를_조회한다(id);
      const descendantIds = descendants.map((d) => d.wiki.id);
      if (descendantIds.includes(data.parentId)) {
        throw new Error('Cannot move to descendant folder');
      }
    }

    wiki.parentId = data.parentId;
    if (data.updatedBy) wiki.updatedBy = data.updatedBy;

    return await this.wikiRepository.save(wiki);
  }

  /**
   * 위키를 삭제한다 (Soft Delete)
   */
  async 위키를_삭제한다(id: string): Promise<boolean> {
    const wiki = await this.ID로_조회한다(id);

    // CASCADE로 자식도 자동 삭제됨
    await this.wikiRepository.softRemove(wiki);

    return true;
  }

  /**
   * 폴더만 삭제한다 (자식이 있으면 실패)
   */
  async 폴더만_삭제한다(id: string): Promise<boolean> {
    const wiki = await this.ID로_조회한다(id);

    if (wiki.type !== WikiFileSystemType.FOLDER) {
      throw new BadRequestException('폴더가 아닙니다.');
    }

    const children = await this.부모_ID로_자식_목록을_조회한다(id);
    if (children.length > 0) {
      throw new BadRequestException('폴더가 비어있지 않습니다. 하위 항목이 있습니다.');
    }

    await this.wikiRepository.softRemove(wiki);

    return true;
  }

  /**
   * 다중 ID로 조회한다
   */
  async 다중_ID로_조회한다(ids: string[]): Promise<WikiFileSystem[]> {
    if (ids.length === 0) return [];

    return await this.wikiRepository.find({
      where: {
        id: In(ids),
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * 위키 항목의 접근 권한을 체크한다 (Cascading)
   * 
   * 파일/폴더 모두 사용 가능
   * - 파일: isPublic false면 무조건 접근 불가, true면 상위 폴더 권한 cascading
   * - 폴더: 상위 폴더들의 권한을 cascading하여 체크
   */
  async 접근_권한을_체크한다(
    wikiId: string,
    employee: {
      id: string;
      rankId?: string;
      positionId?: string;
      departmentId?: string;
    },
  ): Promise<boolean> {
    // 대상 항목 조회
    const targetWiki = await this.ID로_조회한다(wikiId);

    // 파일인 경우: isPublic이 false면 무조건 접근 불가
    if (targetWiki.type === WikiFileSystemType.FILE && !targetWiki.isPublic) {
      return false;
    }

    // 파일의 isPublic이 true이거나, 폴더인 경우: 상위 폴더 권한 체크
    const ancestorFolders = await this.closureRepository
      .createQueryBuilder('closure')
      .innerJoinAndSelect('closure.ancestorNode', 'wiki')
      .where('closure.descendant = :wikiId', { wikiId })
      .andWhere('wiki.type = :type', { type: WikiFileSystemType.FOLDER })
      .andWhere('wiki.deletedAt IS NULL')
      .orderBy('closure.depth', 'DESC')
      .getMany();

    // 루트부터 순차적으로 권한 체크 (Cascading)
    for (const closure of ancestorFolders) {
      const folder = closure.ancestorNode;

      // 전체 공개면 통과
      if (folder.isPublic) {
        continue;
      }

      // 제한 공개인 경우 권한 체크
      const hasAccess =
        (folder.permissionRankIds &&
          employee.rankId &&
          folder.permissionRankIds.includes(employee.rankId)) ||
        (folder.permissionPositionIds &&
          employee.positionId &&
          folder.permissionPositionIds.includes(employee.positionId)) ||
        (folder.permissionDepartmentIds &&
          employee.departmentId &&
          folder.permissionDepartmentIds.includes(employee.departmentId));

      if (!hasAccess) {
        return false; // 상위 폴더에 접근 불가하면 하위도 접근 불가
      }
    }

    return true;
  }

  /**
   * 위키를 검색한다
   */
  async 위키를_검색한다(
    query: string,
  ): Promise<Array<{ wiki: WikiFileSystem; path: Array<{ wiki: WikiFileSystem; depth: number }> }>> {
    this.logger.log(`위키 검색 시작 - 검색어: ${query}`);

    // 파일만 검색 (이름, 제목, 본문)
    const files = await this.wikiRepository
      .createQueryBuilder('wiki')
      .where('wiki.type = :type', { type: WikiFileSystemType.FILE })
      .andWhere('wiki.deletedAt IS NULL')
      .andWhere(
        '(LOWER(wiki.name) LIKE LOWER(:query) OR LOWER(wiki.title) LIKE LOWER(:query) OR LOWER(wiki.content) LIKE LOWER(:query))',
        { query: `%${query}%` },
      )
      .orderBy('wiki.updatedAt', 'DESC')
      .getMany();

    this.logger.log(`검색된 파일: ${files.length}개`);

    // 각 파일의 경로 정보 조회
    const results = await Promise.all(
      files.map(async (file) => {
        const path = await this.상위_경로를_조회한다(file.id);
        return { wiki: file, path };
      }),
    );

    return results;
  }

  /**
   * 경로로 폴더를 조회한다
   * 
   * @param path - 폴더 경로 문자열 (예: "/루트폴더/하위폴더" 또는 "루트폴더/하위폴더")
   * @returns 찾은 폴더 엔티티
   * @throws NotFoundException - 경로상의 폴더가 없을 경우
   */
  async 경로로_폴더를_조회한다(path: string): Promise<WikiFileSystem> {
    this.logger.log(`경로로 폴더 조회 시작 - 경로: ${path}`);

    // path가 undefined, null, 빈 문자열인 경우 에러
    if (!path || typeof path !== 'string') {
      throw new BadRequestException('폴더 경로가 필요합니다.');
    }

    // 경로 파싱: 앞뒤 슬래시 제거 및 빈 문자열 제거
    const trimmedPath = path.trim().replace(/^\/+|\/+$/g, '');
    
    // 빈 경로인 경우 에러
    if (!trimmedPath) {
      throw new BadRequestException('폴더 경로가 비어있습니다.');
    }

    const folderNames = trimmedPath.split('/').filter(name => name.length > 0);
    
    if (folderNames.length === 0) {
      throw new BadRequestException('유효한 폴더 경로가 아닙니다.');
    }

    this.logger.log(`파싱된 경로: [${folderNames.join(' > ')}]`);

    // 루트부터 순차적으로 폴더 찾기
    let currentParentId: string | null = null;
    let currentFolder: WikiFileSystem | null = null;

    for (let i = 0; i < folderNames.length; i++) {
      const folderName = folderNames[i];
      this.logger.log(`폴더 검색 중: "${folderName}" (부모 ID: ${currentParentId || '루트'})`);

      // 현재 레벨에서 해당 이름의 폴더 찾기
      const folder = await this.wikiRepository.findOne({
        where: {
          name: folderName,
          type: WikiFileSystemType.FOLDER,
          parentId: currentParentId === null ? IsNull() : currentParentId,
          deletedAt: IsNull(),
        },
      });

      if (!folder) {
        const pathSoFar = folderNames.slice(0, i + 1).join('/');
        throw new NotFoundException(
          `경로 '${pathSoFar}'에서 폴더 '${folderName}'를 찾을 수 없습니다.`
        );
      }

      currentFolder = folder;
      currentParentId = folder.id;
      this.logger.log(`폴더 찾음: ${folder.name} (ID: ${folder.id})`);
    }

    if (!currentFolder) {
      throw new NotFoundException(`경로 '${path}'에 해당하는 폴더를 찾을 수 없습니다.`);
    }

    this.logger.log(`경로로 폴더 조회 완료 - ID: ${currentFolder.id}, 이름: ${currentFolder.name}`);
    return currentFolder;
  }

}
