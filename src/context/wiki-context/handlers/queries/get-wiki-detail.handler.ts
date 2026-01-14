import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';

export class GetWikiDetailQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetWikiDetailQuery)
export class GetWikiDetailHandler
  implements IQueryHandler<GetWikiDetailQuery, WikiFileSystem>
{
  private readonly logger = new Logger(GetWikiDetailHandler.name);

  constructor(
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  async execute(query: GetWikiDetailQuery): Promise<WikiFileSystem> {
    const { id } = query;

    this.logger.log(`위키 상세 조회 쿼리 실행 - ID: ${id}`);

    return await this.wikiFileSystemService.ID로_조회한다(id);
  }
}
