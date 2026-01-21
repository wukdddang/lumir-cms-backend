import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Language } from './language.entity';
import { LanguageCode } from './language-code.types';

/**
 * 언어 서비스
 * 다국어 지원을 위한 언어 관리 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class LanguageService {
  private readonly logger = new Logger(LanguageService.name);

  constructor(
    @InjectRepository(Language)
    private readonly repository: Repository<Language>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 언어를 생성한다
   */
  async 언어를_생성한다(data: {
    code: LanguageCode;
    name: string;
    isActive: boolean;
    createdBy?: string;
  }): Promise<Language> {
    this.logger.log(`언어 생성 시작 - 코드: ${data.code}, 이름: ${data.name}`);

    const language = this.repository.create(data);
    const saved = await this.repository.save(language);

    this.logger.log(`언어 생성 완료 - ID: ${saved.id}`);
    return saved;
  }

  /**
   * 모든 언어를 조회한다
   */
  async 모든_언어를_조회한다(includeInactive = false): Promise<Language[]> {
    this.logger.debug(`모든 언어 조회 - 비활성 포함: ${includeInactive}`);

    const queryBuilder = this.repository.createQueryBuilder('language');

    if (!includeInactive) {
      queryBuilder.where('language.isActive = :isActive', { isActive: true });
    }

    return await queryBuilder
      .orderBy('language.createdAt', 'ASC')
      .getMany();
  }

  /**
   * ID로 언어를 조회한다
   */
  async ID로_언어를_조회한다(id: string): Promise<Language> {
    this.logger.debug(`언어 조회 - ID: ${id}`);

    const language = await this.repository.findOne({ where: { id } });

    if (!language) {
      throw new NotFoundException(`언어를 찾을 수 없습니다. ID: ${id}`);
    }

    return language;
  }

  /**
   * 코드로 언어를 조회한다
   */
  async 코드로_언어를_조회한다(code: LanguageCode): Promise<Language> {
    this.logger.debug(`언어 조회 - 코드: ${code}`);

    const language = await this.repository.findOne({ where: { code } });

    if (!language) {
      throw new NotFoundException(`언어를 찾을 수 없습니다. 코드: ${code}`);
    }

    return language;
  }

  /**
   * 언어를 업데이트한다
   */
  async 언어를_업데이트한다(
    id: string,
    data: {
      name?: string;
      isActive?: boolean;
      updatedBy?: string;
    },
  ): Promise<Language> {
    this.logger.log(`언어 업데이트 시작 - ID: ${id}`);

    const language = await this.ID로_언어를_조회한다(id);

    if (data.name !== undefined) {
      language.name = data.name;
    }
    if (data.isActive !== undefined) {
      language.isActive = data.isActive;
    }
    if (data.updatedBy) {
      language.updatedBy = data.updatedBy;
    }

    const updated = await this.repository.save(language);

    this.logger.log(`언어 업데이트 완료 - ID: ${id}`);
    return updated;
  }

  /**
   * 언어를 삭제한다 (Soft Delete)
   */
  async 언어를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`언어 삭제 시작 - ID: ${id}`);

    const language = await this.ID로_언어를_조회한다(id);

    await this.repository.softRemove(language);

    this.logger.log(`언어 삭제 완료 - ID: ${id}`);
    return true;
  }

  /**
   * 언어가 존재하는지 확인한다
   */
  async 언어가_존재하는가(code: LanguageCode): Promise<boolean> {
    const count = await this.repository.count({ where: { code } });
    return count > 0;
  }

  /**
   * 활성 언어 개수를 조회한다
   */
  async 활성_언어_개수를_조회한다(): Promise<number> {
    return await this.repository.count({
      where: { isActive: true },
    });
  }

  /**
   * 기본 언어를 조회한다
   * 환경 변수(DEFAULT_LANGUAGE_CODE)에서 설정한 기본 언어를 반환합니다.
   * 예: DEFAULT_LANGUAGE_CODE=ko (한국어), DEFAULT_LANGUAGE_CODE=en (영어)
   */
  async 기본_언어를_조회한다(): Promise<Language> {
    const defaultCode = this.configService.get<string>('DEFAULT_LANGUAGE_CODE', 'en') as LanguageCode;
    this.logger.debug(`기본 언어 조회 - 코드: ${defaultCode}`);
    
    return await this.코드로_언어를_조회한다(defaultCode);
  }
}
