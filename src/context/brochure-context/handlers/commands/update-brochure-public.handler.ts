import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { UpdateBrochurePublicDto } from '../../interfaces/brochure-context.interface';
import { Logger, NotFoundException } from '@nestjs/common';

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

  constructor(
    @InjectRepository(Brochure)
    private readonly brochureRepository: Repository<Brochure>,
  ) {}

  async execute(command: UpdateBrochurePublicCommand): Promise<Brochure> {
    const { id, data } = command;

    this.logger.log(`브로슈어 공개 상태 수정 시작 - ID: ${id}`);

    // 브로슈어 조회
    const brochure = await this.brochureRepository.findOne({ where: { id } });

    if (!brochure) {
      throw new NotFoundException(`브로슈어를 찾을 수 없습니다. ID: ${id}`);
    }

    // 공개 상태 업데이트
    brochure.isPublic = data.isPublic;
    if (data.updatedBy) {
      brochure.updatedBy = data.updatedBy;
    }

    const updated = await this.brochureRepository.save(brochure);

    this.logger.log(`브로슈어 공개 상태 수정 완료 - ID: ${id}`);

    return updated;
  }
}
