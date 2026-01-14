import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrochureService } from '@domain/core/brochure/brochure.service';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import { UpdateBrochureDto } from '../../interfaces/brochure-context.interface';
import { Logger } from '@nestjs/common';

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
    private readonly brochureService: BrochureService,
    @InjectRepository(BrochureTranslation)
    private readonly brochureTranslationRepository: Repository<BrochureTranslation>,
  ) {}

  async execute(command: UpdateBrochureCommand): Promise<Brochure> {
    const { id, data } = command;

    this.logger.log(`브로슈어 수정 시작 - ID: ${id}`);

    // 브로슈어 업데이트
    const updateData: Partial<Brochure> = {};
    if (data.isPublic !== undefined) {
      updateData.isPublic = data.isPublic;
    }
    if (data.order !== undefined) {
      updateData.order = data.order;
    }
    if (data.attachments !== undefined) {
      updateData.attachments = data.attachments;
    }
    if (data.updatedBy) {
      updateData.updatedBy = data.updatedBy;
    }

    const updated = await this.brochureService.브로슈어를_업데이트한다(
      id,
      updateData,
    );

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
