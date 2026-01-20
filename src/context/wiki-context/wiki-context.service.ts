import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateFolderCommand } from './handlers/commands/create-folder.handler';
import { CreateFileCommand } from './handlers/commands/create-file.handler';
import { UpdateWikiCommand } from './handlers/commands/update-wiki.handler';
import { UpdateWikiFileCommand } from './handlers/commands/update-wiki-file.handler';
import { UpdateWikiPublicCommand } from './handlers/commands/update-wiki-public.handler';
import { UpdateWikiPathCommand } from './handlers/commands/update-wiki-path.handler';
import { DeleteWikiCommand } from './handlers/commands/delete-wiki.handler';
import { DeleteFolderOnlyCommand } from './handlers/commands/delete-folder-only.handler';
import { GetWikiDetailQuery } from './handlers/queries/get-wiki-detail.handler';
import { GetFolderChildrenQuery } from './handlers/queries/get-folder-children.handler';
import { GetFolderStructureQuery } from './handlers/queries/get-folder-structure.handler';
import { GetWikiBreadcrumbQuery } from './handlers/queries/get-wiki-breadcrumb.handler';
import { SearchWikiQuery } from './handlers/queries/search-wiki.handler';
import { GetFolderByPathQuery } from './handlers/queries/get-folder-by-path.handler';
import {
  CreateFolderDto,
  CreateFileDto,
  UpdateWikiDto,
  UpdateWikiFileDto,
  UpdateWikiPublicDto,
  UpdateWikiPathDto,
  CreateWikiResult,
  FolderStructureResult,
} from './interfaces/wiki-context.interface';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';

/**
 * Wiki 컨텍스트 서비스
 *
 * Wiki 파일 시스템 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class WikiContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  /**
   * 폴더를 생성한다
   */
  async 폴더를_생성한다(data: CreateFolderDto): Promise<CreateWikiResult> {
    const command = new CreateFolderCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 파일을 생성한다
   */
  async 파일을_생성한다(data: CreateFileDto): Promise<CreateWikiResult> {
    const command = new CreateFileCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 위키를 수정한다
   */
  async 위키를_수정한다(
    id: string,
    data: UpdateWikiDto,
  ): Promise<WikiFileSystem> {
    const command = new UpdateWikiCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 위키 파일을 수정한다
   */
  async 위키_파일을_수정한다(
    id: string,
    data: UpdateWikiFileDto,
  ): Promise<WikiFileSystem> {
    const command = new UpdateWikiFileCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 위키 공개를 수정한다
   */
  async 위키_공개를_수정한다(
    id: string,
    data: UpdateWikiPublicDto,
  ): Promise<WikiFileSystem> {
    const command = new UpdateWikiPublicCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 위키 경로를 수정한다
   */
  async 위키_경로를_수정한다(
    id: string,
    data: UpdateWikiPathDto,
  ): Promise<WikiFileSystem> {
    const command = new UpdateWikiPathCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 위키를 삭제한다
   */
  async 위키를_삭제한다(id: string): Promise<boolean> {
    const command = new DeleteWikiCommand(id);
    return await this.commandBus.execute(command);
  }

  /**
   * 폴더만 삭제한다
   */
  async 폴더만_삭제한다(id: string): Promise<boolean> {
    const command = new DeleteFolderOnlyCommand(id);
    return await this.commandBus.execute(command);
  }

  /**
   * 위키 상세를 조회한다
   */
  async 위키_상세를_조회한다(id: string): Promise<WikiFileSystem> {
    const query = new GetWikiDetailQuery(id);
    return await this.queryBus.execute(query);
  }

  /**
   * 폴더 자식들을 조회한다
   */
  async 폴더_자식들을_조회한다(
    parentId: string | null,
  ): Promise<WikiFileSystem[]> {
    const query = new GetFolderChildrenQuery(parentId);
    return await this.queryBus.execute(query);
  }

  /**
   * 폴더 구조를 조회한다
   */
  async 폴더_구조를_조회한다(
    ancestorId: string,
  ): Promise<FolderStructureResult[]> {
    const query = new GetFolderStructureQuery(ancestorId);
    return await this.queryBus.execute(query);
  }

  /**
   * 위키 경로를 조회한다 (Breadcrumb)
   */
  async 위키_경로를_조회한다(descendantId: string): Promise<WikiFileSystem[]> {
    const query = new GetWikiBreadcrumbQuery(descendantId);
    return await this.queryBus.execute(query);
  }

  /**
   * 위키를 검색한다
   */
  async 위키를_검색한다(
    query: string,
  ): Promise<Array<{ wiki: WikiFileSystem; path: Array<{ wiki: WikiFileSystem; depth: number }> }>> {
    const searchQuery = new SearchWikiQuery(query);
    return await this.queryBus.execute(searchQuery);
  }

  /**
   * 모든 위키를 조회한다
   */
  async 모든_위키를_조회한다(): Promise<WikiFileSystem[]> {
    return await this.wikiFileSystemService.모든_위키를_조회한다();
  }

  /**
   * 경로로 폴더를 조회한다
   */
  async 경로로_폴더를_조회한다(path: string): Promise<WikiFileSystem> {
    const query = new GetFolderByPathQuery(path);
    return await this.queryBus.execute(query);
  }

}
