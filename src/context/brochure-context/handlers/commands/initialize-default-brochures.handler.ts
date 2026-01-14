import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrochureService } from '@domain/core/brochure/brochure.service';
import { LanguageService } from '@domain/common/language/language.service';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';

/**
 * 기본 브로슈어 생성 커맨드
 */
export class InitializeDefaultBrochuresCommand {
  constructor(public readonly createdBy?: string) {}
}

/**
 * 기본 브로슈어 생성 핸들러
 */
@CommandHandler(InitializeDefaultBrochuresCommand)
export class InitializeDefaultBrochuresHandler implements ICommandHandler<InitializeDefaultBrochuresCommand> {
  private readonly logger = new Logger(InitializeDefaultBrochuresHandler.name);

  constructor(
    private readonly brochureService: BrochureService,
    private readonly languageService: LanguageService,
    @InjectRepository(BrochureTranslation)
    private readonly translationRepository: Repository<BrochureTranslation>,
  ) {}

  async execute(
    command: InitializeDefaultBrochuresCommand,
  ): Promise<Brochure[]> {
    this.logger.log('기본 브로슈어 생성 시작');

    // 언어 조회
    const languages = await this.languageService.모든_언어를_조회한다(false);

    if (languages.length === 0) {
      this.logger.warn('활성 언어가 없습니다. 언어를 먼저 등록해주세요.');
      return [];
    }

    const defaultBrochures = [
      {
        isPublic: true,
        order: 1,
        translations: {
          ko: {
            title: '회사 소개 브로슈어',
            description: '루미르 회사 소개 자료입니다.',
          },
          en: {
            title: 'Company Introduction Brochure',
            description: 'Lumir company introduction materials.',
          },
          ja: {
            title: '会社紹介ブローシャー',
            description: 'ルミール会社紹介資料です。',
          },
          zh: {
            title: '公司介绍手册',
            description: 'Lumir公司介绍资料。',
          },
        },
        attachments: [
          {
            fileName: 'company_intro_ko.pdf',
            fileUrl: 'https://example.com/brochures/company_intro_ko.pdf',
            fileSize: 1024000,
            mimeType: 'application/pdf',
          },
          {
            fileName: 'company_intro_en.pdf',
            fileUrl: 'https://example.com/brochures/company_intro_en.pdf',
            fileSize: 1024000,
            mimeType: 'application/pdf',
          },
        ],
      },
      {
        isPublic: true,
        order: 2,
        translations: {
          ko: {
            title: '제품 카탈로그',
            description: '루미르 제품 카탈로그입니다.',
          },
          en: {
            title: 'Product Catalog',
            description: 'Lumir product catalog.',
          },
          ja: {
            title: '製品カタログ',
            description: 'ルミール製品カタログです。',
          },
          zh: {
            title: '产品目录',
            description: 'Lumir产品目录。',
          },
        },
        attachments: [
          {
            fileName: 'product_catalog_ko.pdf',
            fileUrl: 'https://example.com/brochures/product_catalog_ko.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
        ],
      },
      {
        isPublic: false,
        order: 3,
        translations: {
          ko: {
            title: '기술 백서',
            description: '루미르 기술 백서 (준비 중).',
          },
          en: {
            title: 'Technical White Paper',
            description: 'Lumir technical white paper (in preparation).',
          },
        },
        attachments: [],
      },
    ];

    const createdBrochures: Brochure[] = [];

    for (const brochureData of defaultBrochures) {
      // 브로슈어 생성
      const savedBrochure = await this.brochureService.브로슈어를_생성한다({
        isPublic: brochureData.isPublic,
        order: brochureData.order,
        attachments:
          brochureData.attachments.length > 0 ? brochureData.attachments : null,
        createdBy: command.createdBy,
        updatedBy: command.createdBy, // 생성 시점이므로 createdBy와 동일하게 설정
      });

      // 번역 생성
      for (const language of languages) {
        const langCode = language.code;
        const translationData = brochureData.translations[langCode];

        if (translationData) {
          const translation = this.translationRepository.create({
            brochureId: savedBrochure.id,
            languageId: language.id,
            title: translationData.title,
            description: translationData.description || null,
          });

          await this.translationRepository.save(translation);
        }
      }

      // 번역과 함께 다시 조회
      const brochureWithTranslations =
        await this.brochureService.ID로_브로슈어를_조회한다(savedBrochure.id);

      createdBrochures.push(brochureWithTranslations);
      this.logger.log(
        `기본 브로슈어 추가 완료 - ${brochureData.translations.ko?.title || 'Unknown'}`,
      );
    }

    this.logger.log(
      `기본 브로슈어 생성 완료 - 총 ${createdBrochures.length}개 추가됨`,
    );

    return createdBrochures;
  }
}
