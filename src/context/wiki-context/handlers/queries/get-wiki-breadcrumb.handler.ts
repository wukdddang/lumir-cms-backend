import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';

export class GetWikiBreadcrumbQuery {
  constructor(public readonly descendantId: string) {}
}

@QueryHandler(GetWikiBreadcrumbQuery)
export class GetWikiBreadcrumbHandler
  implements IQueryHandler<GetWikiBreadcrumbQuery, WikiFileSystem[]>
{
  private readonly logger = new Logger(GetWikiBreadcrumbHandler.name);

  constructor(
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  async execute(query: GetWikiBreadcrumbQuery): Promise<WikiFileSystem[]> {
    const { descendantId } = query;

    this.logger.log(`위키 경로 조회 쿼리 실행 - ID: ${descendantId}`);

    const results = await this.wikiFileSystemService.상위_경로를_조회한다(descendantId);

    return results.map((r) => r.wiki);
  }
}
