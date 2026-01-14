import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';

export class DeleteFolderOnlyCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteFolderOnlyCommand)
export class DeleteFolderOnlyHandler
  implements ICommandHandler<DeleteFolderOnlyCommand, boolean>
{
  private readonly logger = new Logger(DeleteFolderOnlyHandler.name);

  constructor(
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  async execute(command: DeleteFolderOnlyCommand): Promise<boolean> {
    const { id } = command;

    this.logger.log(`폴더만 삭제 커맨드 실행 - ID: ${id}`);

    return await this.wikiFileSystemService.폴더만_삭제한다(id);
  }
}
