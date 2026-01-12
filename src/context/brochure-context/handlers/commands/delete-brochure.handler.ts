import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BrochureService } from '@domain/core/brochure/brochure.service';
import { Logger } from '@nestjs/common';

/**
 * 브로슈어 삭제 커맨드
 */
export class DeleteBrochureCommand {
  constructor(public readonly id: string) {}
}

/**
 * 브로슈어 삭제 핸들러
 */
@CommandHandler(DeleteBrochureCommand)
export class DeleteBrochureHandler implements ICommandHandler<DeleteBrochureCommand> {
  private readonly logger = new Logger(DeleteBrochureHandler.name);

  constructor(private readonly brochureService: BrochureService) {}

  async execute(command: DeleteBrochureCommand): Promise<boolean> {
    const { id } = command;

    this.logger.log(`브로슈어 삭제 시작 - ID: ${id}`);

    const result = await this.brochureService.브로슈어를_삭제한다(id);

    this.logger.log(`브로슈어 삭제 완료 - ID: ${id}`);

    return result;
  }
}
