import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LumirStoryService } from '@domain/sub/lumir-story/lumir-story.service';
import { Logger } from '@nestjs/common';

/**
 * 루미르스토리 삭제 커맨드
 */
export class DeleteLumirStoryCommand {
  constructor(public readonly id: string) {}
}

/**
 * 루미르스토리 삭제 핸들러
 */
@CommandHandler(DeleteLumirStoryCommand)
export class DeleteLumirStoryHandler
  implements ICommandHandler<DeleteLumirStoryCommand>
{
  private readonly logger = new Logger(DeleteLumirStoryHandler.name);

  constructor(private readonly lumirStoryService: LumirStoryService) {}

  async execute(command: DeleteLumirStoryCommand): Promise<boolean> {
    const { id } = command;

    this.logger.log(`루미르스토리 삭제 시작 - ID: ${id}`);

    const result = await this.lumirStoryService.루미르스토리를_삭제한다(id);

    this.logger.log(`루미르스토리 삭제 완료 - ID: ${id}`);

    return result;
  }
}
