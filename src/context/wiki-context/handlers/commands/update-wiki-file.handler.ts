import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { UpdateWikiFileDto } from '../../interfaces/wiki-context.interface';

export class UpdateWikiFileCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateWikiFileDto,
  ) {}
}

@CommandHandler(UpdateWikiFileCommand)
export class UpdateWikiFileHandler
  implements ICommandHandler<UpdateWikiFileCommand, WikiFileSystem>
{
  private readonly logger = new Logger(UpdateWikiFileHandler.name);

  constructor(
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  async execute(command: UpdateWikiFileCommand): Promise<WikiFileSystem> {
    const { id, data } = command;

    this.logger.log(`위키 파일 수정 커맨드 실행 - ID: ${id}`);

    return await this.wikiFileSystemService.위키를_수정한다(id, {
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      attachments: data.attachments,
      updatedBy: data.updatedBy,
    });
  }
}
