import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';

export class GetFolderByPathQuery {
  constructor(public readonly path: string) {}
}

@QueryHandler(GetFolderByPathQuery)
export class GetFolderByPathHandler
  implements IQueryHandler<GetFolderByPathQuery, WikiFileSystem>
{
  private readonly logger = new Logger(GetFolderByPathHandler.name);

  constructor(
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  async execute(query: GetFolderByPathQuery): Promise<WikiFileSystem> {
    const { path } = query;

    this.logger.log(`경로로 폴더 조회 쿼리 실행 - 경로: ${path}`);

    return await this.wikiFileSystemService.경로로_폴더를_조회한다(path);
  }
}
