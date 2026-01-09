import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import { CreateBrochureDto, CreateBrochureResult } from '../../interfaces/brochure-context.interface';
import { Logger } from '@nestjs/common';

/**
 * 브로슈어 생성 커맨드
 */
export class CreateBrochureCommand {
  constructor(public readonly data: CreateBrochureDto) {}
}

/**
 * 브로슈어 생성 핸들러
 */
@CommandHandler(CreateBrochureCommand)
export class CreateBrochureHandler implements ICommandHandler<CreateBrochureCommand> {
  private readonly logger = new Logger(CreateBrochureHandler.name);

  constructor(
    @InjectRepository(Brochure)
    private readonly brochureRepository: Repository<Brochure>,
    @InjectRepository(BrochureTranslation)
    private readonly brochureTranslationRepository: Repository<BrochureTranslation>,
  ) {}

  async execute(command: CreateBrochureCommand): Promise<CreateBrochureResult> {
    const { data } = command;

    this.logger.log(`브로슈어 생성 시작`);

    // 브로슈어 생성
    const brochure = this.brochureRepository.create({
      isPublic: data.isPublic,
      status: data.status,
      order: data.order,
      attachments: data.attachments || null,
      createdBy: data.createdBy,
    });

    const saved = await this.brochureRepository.save(brochure);

    // 번역 생성
    if (data.translations && data.translations.length > 0) {
      const translations = data.translations.map((trans) =>
        this.brochureTranslationRepository.create({
          brochureId: saved.id,
          languageId: trans.languageId,
          title: trans.title,
          description: trans.description,
          createdBy: data.createdBy,
        }),
      );

      await this.brochureTranslationRepository.save(translations);
    }

    this.logger.log(`브로슈어 생성 완료 - ID: ${saved.id}`);

    return {
      id: saved.id,
      isPublic: saved.isPublic,
      status: saved.status,
      order: saved.order,
      createdAt: saved.createdAt,
    };
  }
}
