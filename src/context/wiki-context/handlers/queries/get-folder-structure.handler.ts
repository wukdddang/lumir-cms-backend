import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';
import { FolderStructureResult } from '../../interfaces/wiki-context.interface';

export class GetFolderStructureQuery {
  constructor(public readonly ancestorId: string) {}
}

@QueryHandler(GetFolderStructureQuery)
export class GetFolderStructureHandler
  implements IQueryHandler<GetFolderStructureQuery, FolderStructureResult[]>
{
  private readonly logger = new Logger(GetFolderStructureHandler.name);

  constructor(
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  async execute(query: GetFolderStructureQuery): Promise<FolderStructureResult[]> {
    const { ancestorId } = query;

    this.logger.log(`폴더 구조 조회 쿼리 실행 - 조상 ID: ${ancestorId}`);

    const results = await this.wikiFileSystemService.폴더_구조를_조회한다(ancestorId);

    return results.map((r) => ({
      wiki: r.wiki,
      depth: r.depth,
    }));
  }
}
