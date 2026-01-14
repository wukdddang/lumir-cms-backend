import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';

export class DeleteWikiCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteWikiCommand)
export class DeleteWikiHandler
  implements ICommandHandler<DeleteWikiCommand, boolean>
{
  private readonly logger = new Logger(DeleteWikiHandler.name);

  constructor(
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  async execute(command: DeleteWikiCommand): Promise<boolean> {
    const { id } = command;

    this.logger.log(`위키 삭제 커맨드 실행 - ID: ${id}`);

    return await this.wikiFileSystemService.위키를_삭제한다(id);
  }
}
