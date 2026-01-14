import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WikiFileSystemService } from '@domain/sub/wiki-file-system/wiki-file-system.service';
import { CreateFolderDto, CreateWikiResult } from '../../interfaces/wiki-context.interface';

export class CreateFolderCommand {
  constructor(public readonly data: CreateFolderDto) {}
}

@CommandHandler(CreateFolderCommand)
export class CreateFolderHandler
  implements ICommandHandler<CreateFolderCommand, CreateWikiResult>
{
  private readonly logger = new Logger(CreateFolderHandler.name);

  constructor(
    private readonly wikiFileSystemService: WikiFileSystemService,
  ) {}

  async execute(command: CreateFolderCommand): Promise<CreateWikiResult> {
    const { data } = command;

    this.logger.log(`폴더 생성 커맨드 실행 - 이름: ${data.name}`);

    const folder = await this.wikiFileSystemService.폴더를_생성한다(data);

    return {
      id: folder.id,
      name: folder.name,
      type: folder.type,
    };
  }
}
