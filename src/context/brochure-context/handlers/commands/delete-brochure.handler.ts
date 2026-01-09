import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { Logger, NotFoundException } from '@nestjs/common';

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

  constructor(
    @InjectRepository(Brochure)
    private readonly brochureRepository: Repository<Brochure>,
  ) {}

  async execute(command: DeleteBrochureCommand): Promise<boolean> {
    const { id } = command;

    this.logger.log(`브로슈어 삭제 시작 - ID: ${id}`);

    // 브로슈어 조회
    const brochure = await this.brochureRepository.findOne({ where: { id } });

    if (!brochure) {
      throw new NotFoundException(`브로슈어를 찾을 수 없습니다. ID: ${id}`);
    }

    // Soft Delete
    await this.brochureRepository.softRemove(brochure);

    this.logger.log(`브로슈어 삭제 완료 - ID: ${id}`);

    return true;
  }
}
