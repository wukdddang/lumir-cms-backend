import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { UpdateWikiPathDto } from '../../interfaces/wiki-context.interface';

export class UpdateWikiPathCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateWikiPathDto,
  ) {}
}

@CommandHandler(UpdateWikiPathCommand)
export class UpdateWikiPathHandler
  implements ICommandHandler<UpdateWikiPathCommand, WikiFileSystem>
{
  private readonly logger = new Logger(UpdateWikiPathHandler.name);

  constructor(
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  async execute(command: UpdateWikiPathCommand): Promise<WikiFileSystem> {
    const { id, data } = command;

    this.logger.log(`위키 경로 수정 커맨드 실행 - ID: ${id}`);

    return await this.wikiFileSystemService.경로를_수정한다(id, data);
  }
}
