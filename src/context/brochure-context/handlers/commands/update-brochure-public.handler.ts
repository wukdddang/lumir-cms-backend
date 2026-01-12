import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BrochureService } from '@domain/core/brochure/brochure.service';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { UpdateBrochurePublicDto } from '../../interfaces/brochure-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 브로슈어 공개 상태 수정 커맨드
 */
export class UpdateBrochurePublicCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateBrochurePublicDto,
  ) {}
}

/**
 * 브로슈어 공개 상태 수정 핸들러
 */
@CommandHandler(UpdateBrochurePublicCommand)
export class UpdateBrochurePublicHandler implements ICommandHandler<UpdateBrochurePublicCommand> {
  private readonly logger = new Logger(UpdateBrochurePublicHandler.name);

  constructor(private readonly brochureService: BrochureService) {}

  async execute(command: UpdateBrochurePublicCommand): Promise<Brochure> {
    const { id, data } = command;

    this.logger.log(`브로슈어 공개 상태 수정 시작 - ID: ${id}`);

    const updated = await this.brochureService.브로슈어_공개_여부를_변경한다(
      id,
      data.isPublic,
      data.updatedBy,
    );

    this.logger.log(`브로슈어 공개 상태 수정 완료 - ID: ${id}`);

    return updated;
  }
}
