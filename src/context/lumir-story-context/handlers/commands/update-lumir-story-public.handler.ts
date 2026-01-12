import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LumirStoryService } from '@domain/sub/lumir-story/lumir-story.service';
import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';
import { UpdateLumirStoryPublicDto } from '../../interfaces/lumir-story-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 루미르스토리 공개 수정 커맨드
 */
export class UpdateLumirStoryPublicCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateLumirStoryPublicDto,
  ) {}
}

/**
 * 루미르스토리 공개 수정 핸들러
 */
@CommandHandler(UpdateLumirStoryPublicCommand)
export class UpdateLumirStoryPublicHandler
  implements ICommandHandler<UpdateLumirStoryPublicCommand>
{
  private readonly logger = new Logger(UpdateLumirStoryPublicHandler.name);

  constructor(private readonly lumirStoryService: LumirStoryService) {}

  async execute(command: UpdateLumirStoryPublicCommand): Promise<LumirStory> {
    const { id, data } = command;

    this.logger.log(`루미르스토리 공개 수정 시작 - ID: ${id}`);

    const updated =
      await this.lumirStoryService.루미르스토리_공개_여부를_변경한다(
        id,
        data.isPublic,
        data.updatedBy,
      );

    this.logger.log(`루미르스토리 공개 수정 완료 - ID: ${id}`);

    return updated;
  }
}
