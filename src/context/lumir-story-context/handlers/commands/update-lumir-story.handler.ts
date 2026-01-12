import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LumirStoryService } from '@domain/sub/lumir-story/lumir-story.service';
import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';
import { UpdateLumirStoryDto } from '../../interfaces/lumir-story-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 루미르스토리 수정 커맨드
 */
export class UpdateLumirStoryCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateLumirStoryDto,
  ) {}
}

/**
 * 루미르스토리 수정 핸들러
 */
@CommandHandler(UpdateLumirStoryCommand)
export class UpdateLumirStoryHandler
  implements ICommandHandler<UpdateLumirStoryCommand>
{
  private readonly logger = new Logger(UpdateLumirStoryHandler.name);

  constructor(private readonly lumirStoryService: LumirStoryService) {}

  async execute(command: UpdateLumirStoryCommand): Promise<LumirStory> {
    const { id, data } = command;

    this.logger.log(`루미르스토리 수정 시작 - ID: ${id}`);

    const updated = await this.lumirStoryService.루미르스토리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`루미르스토리 수정 완료 - ID: ${id}`);

    return updated;
  }
}
