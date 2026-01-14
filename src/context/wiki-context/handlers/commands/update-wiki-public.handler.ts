import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { UpdateWikiPublicDto } from '../../interfaces/wiki-context.interface';

export class UpdateWikiPublicCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateWikiPublicDto,
  ) {}
}

@CommandHandler(UpdateWikiPublicCommand)
export class UpdateWikiPublicHandler
  implements ICommandHandler<UpdateWikiPublicCommand, WikiFileSystem>
{
  private readonly logger = new Logger(UpdateWikiPublicHandler.name);

  constructor(
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  async execute(command: UpdateWikiPublicCommand): Promise<WikiFileSystem> {
    const { id, data } = command;

    this.logger.log(`위키 공개 수정 커맨드 실행 - ID: ${id}`);

    return await this.wikiFileSystemService.공개를_수정한다(id, data);
  }
}
