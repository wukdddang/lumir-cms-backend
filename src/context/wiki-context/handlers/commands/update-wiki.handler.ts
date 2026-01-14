import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { UpdateWikiDto } from '../../interfaces/wiki-context.interface';

export class UpdateWikiCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateWikiDto,
  ) {}
}

@CommandHandler(UpdateWikiCommand)
export class UpdateWikiHandler
  implements ICommandHandler<UpdateWikiCommand, WikiFileSystem>
{
  private readonly logger = new Logger(UpdateWikiHandler.name);

  constructor(
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  async execute(command: UpdateWikiCommand): Promise<WikiFileSystem> {
    const { id, data } = command;

    this.logger.log(`위키 수정 커맨드 실행 - ID: ${id}`);

    return await this.wikiFileSystemService.위키를_수정한다(id, data);
  }
}
