import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';

export class GetFolderChildrenQuery {
  constructor(public readonly parentId: string | null) {}
}

@QueryHandler(GetFolderChildrenQuery)
export class GetFolderChildrenHandler
  implements IQueryHandler<GetFolderChildrenQuery, WikiFileSystem[]>
{
  private readonly logger = new Logger(GetFolderChildrenHandler.name);

  constructor(
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  async execute(query: GetFolderChildrenQuery): Promise<WikiFileSystem[]> {
    const { parentId } = query;

    this.logger.log(`폴더 자식 조회 쿼리 실행 - 부모 ID: ${parentId || 'null (루트)'}`);

    if (parentId === null) {
      return await this.wikiFileSystemService.루트_폴더_목록을_조회한다();
    }

    return await this.wikiFileSystemService.부모_ID로_자식_목록을_조회한다(parentId);
  }
}
