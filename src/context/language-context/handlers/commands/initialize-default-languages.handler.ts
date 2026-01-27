import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '@domain/common/language/language.entity';
import { Logger } from '@nestjs/common';

/**
 * 기본 언어 초기화 커맨드
 */
export class InitializeDefaultLanguagesCommand {
  constructor(public readonly createdBy?: string) {}
}

/**
 * 기본 언어 초기화 핸들러
 */
@CommandHandler(InitializeDefaultLanguagesCommand)
export class InitializeDefaultLanguagesHandler
  implements ICommandHandler<InitializeDefaultLanguagesCommand>
{
  private readonly logger = new Logger(InitializeDefaultLanguagesHandler.name);

  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  async execute(
    command: InitializeDefaultLanguagesCommand,
  ): Promise<Language[]> {
    this.logger.log('기본 언어 초기화 시작');

    // 기본 언어 목록 (English를 첫 번째로 설정)
    const defaultLanguages = [
      { code: 'en', name: 'English' }, // 기본 언어
      { code: 'ko', name: '한국어' },
      { code: 'ja', name: '日本語' },
      { code: 'zh', name: '中文' },
    ];

    const createdLanguages: Language[] = [];

    for (const lang of defaultLanguages) {
      // 이미 존재하는지 확인
      const existing = await this.languageRepository.findOne({
        where: { code: lang.code },
      });

      if (!existing) {
        const language = this.languageRepository.create({
          code: lang.code,
          name: lang.name,
          isActive: true,
          createdBy: command.createdBy,
        });
        const saved = await this.languageRepository.save(language);
        createdLanguages.push(saved);
        
        if (lang.code === 'en') {
          this.logger.log(`✅ 기본 언어 추가 완료 - ${lang.name} (${lang.code}) [기본]`);
        } else {
          this.logger.log(`기본 언어 추가 완료 - ${lang.name} (${lang.code})`);
        }
      } else {
        if (lang.code === 'en') {
          this.logger.log(
            `✅ 기본 언어 확인 완료 - ${lang.name} (${lang.code}) [기본, 이미 존재]`,
          );
        } else {
          this.logger.log(
            `기본 언어 건너뛰기 - ${lang.name} (${lang.code}) 이미 존재`,
          );
        }
      }
    }

    this.logger.log(
      `기본 언어 초기화 완료 - 총 ${createdLanguages.length}개 추가됨`,
    );

    return createdLanguages;
  }
}
