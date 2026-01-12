import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LumirStoryService } from '@domain/sub/lumir-story/lumir-story.service';
import { Logger } from '@nestjs/common';

/**
 * 루미르스토리 오더 일괄 수정 DTO
 */
export interface UpdateLumirStoryBatchOrderDto {
  lumirStories: Array<{ id: string; order: number }>;
  updatedBy?: string;
}

/**
 * 루미르스토리 오더 일괄 수정 커맨드
 */
export class UpdateLumirStoryBatchOrderCommand {
  constructor(public readonly data: UpdateLumirStoryBatchOrderDto) {}
}

/**
 * 루미르스토리 오더 일괄 수정 핸들러
 */
@CommandHandler(UpdateLumirStoryBatchOrderCommand)
export class UpdateLumirStoryBatchOrderHandler
  implements ICommandHandler<UpdateLumirStoryBatchOrderCommand>
{
  private readonly logger = new Logger(
    UpdateLumirStoryBatchOrderHandler.name,
  );

  constructor(private readonly lumirStoryService: LumirStoryService) {}

  async execute(
    command: UpdateLumirStoryBatchOrderCommand,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const { data } = command;

    this.logger.log(
      `루미르스토리 오더 일괄 수정 시작 - 수정할 루미르스토리 수: ${data.lumirStories.length}`,
    );

    const result =
      await this.lumirStoryService.루미르스토리_오더를_일괄_업데이트한다(
        data.lumirStories,
        data.updatedBy,
      );

    this.logger.log(
      `루미르스토리 오더 일괄 수정 완료 - 수정된 루미르스토리 수: ${result.updatedCount}`,
    );

    return result;
  }
}
