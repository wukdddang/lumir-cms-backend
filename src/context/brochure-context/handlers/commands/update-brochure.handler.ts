import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import { UpdateBrochureDto } from '../../interfaces/brochure-context.interface';
import { Logger, NotFoundException } from '@nestjs/common';

/**
 * 브로슈어 수정 커맨드
 */
export class UpdateBrochureCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateBrochureDto,
  ) {}
}

/**
 * 브로슈어 수정 핸들러
 */
@CommandHandler(UpdateBrochureCommand)
export class UpdateBrochureHandler implements ICommandHandler<UpdateBrochureCommand> {
  private readonly logger = new Logger(UpdateBrochureHandler.name);

  constructor(
    @InjectRepository(Brochure)
    private readonly brochureRepository: Repository<Brochure>,
    @InjectRepository(BrochureTranslation)
    private readonly brochureTranslationRepository: Repository<BrochureTranslation>,
  ) {}

  async execute(command: UpdateBrochureCommand): Promise<Brochure> {
    const { id, data } = command;

    this.logger.log(`브로슈어 수정 시작 - ID: ${id}`);

    // 브로슈어 조회
    const brochure = await this.brochureRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!brochure) {
      throw new NotFoundException(`브로슈어를 찾을 수 없습니다. ID: ${id}`);
    }

    // 브로슈어 업데이트
    if (data.isPublic !== undefined) {
      brochure.isPublic = data.isPublic;
    }
    if (data.status !== undefined) {
      brochure.status = data.status;
    }
    if (data.order !== undefined) {
      brochure.order = data.order;
    }
    if (data.attachments !== undefined) {
      brochure.attachments = data.attachments;
    }
    if (data.updatedBy) {
      brochure.updatedBy = data.updatedBy;
    }

    const updated = await this.brochureRepository.save(brochure);

    // 번역 업데이트
    if (data.translations && data.translations.length > 0) {
      // 기존 번역 삭제
      await this.brochureTranslationRepository.delete({ brochureId: id });

      // 새 번역 생성
      const translations = data.translations.map((trans) =>
        this.brochureTranslationRepository.create({
          brochureId: id,
          languageId: trans.languageId,
          title: trans.title,
          description: trans.description,
          createdBy: data.updatedBy,
        }),
      );

      await this.brochureTranslationRepository.save(translations);
    }

    this.logger.log(`브로슈어 수정 완료 - ID: ${id}`);

    return updated;
  }
}
