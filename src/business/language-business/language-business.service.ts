import { Injectable, Logger } from '@nestjs/common';
import { LanguageContextService } from '@context/language-context/language-context.service';
import { Language } from '@domain/common/language/language.entity';
import { LanguageCode } from '@domain/common/language/language-code.types';

/**
 * 언어 비즈니스 서비스
 *
 * 언어 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class LanguageBusinessService {
  private readonly logger = new Logger(LanguageBusinessService.name);

  constructor(
    private readonly languageContextService: LanguageContextService,
  ) {}

  /**
   * 언어 목록을 조회한다
   */
  async 언어_목록을_조회한다(
    includeInactive: boolean = false,
  ): Promise<Language[]> {
    this.logger.log(`언어 목록 조회 시작 - 비활성 포함: ${includeInactive}`);

    const result =
      await this.languageContextService.언어_목록을_조회한다(includeInactive);

    this.logger.log(`언어 목록 조회 완료 - 총 ${result.total}개`);

    return result.items;
  }

  /**
   * 언어 상세를 조회한다
   */
  async 언어_상세를_조회한다(id: string): Promise<Language> {
    this.logger.log(`언어 상세 조회 시작 - ID: ${id}`);

    const result = await this.languageContextService.언어_상세를_조회한다(id);

    this.logger.log(`언어 상세 조회 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 언어를 생성한다
   */
  async 언어를_생성한다(data: {
    code: LanguageCode;
    name: string;
    isActive: boolean;
    createdBy?: string;
  }): Promise<Language> {
    this.logger.log(`언어 생성 시작 - 코드: ${data.code}`);

    const result = await this.languageContextService.언어를_생성한다(data);

    this.logger.log(`언어 생성 완료 - ID: ${result.id}`);

    // 상세 정보 조회
    return await this.languageContextService.언어_상세를_조회한다(result.id);
  }

  /**
   * 언어를 수정한다
   */
  async 언어를_수정한다(
    id: string,
    data: {
      name?: string;
      isActive?: boolean;
      updatedBy?: string;
    },
  ): Promise<Language> {
    this.logger.log(`언어 수정 시작 - ID: ${id}`);

    const result = await this.languageContextService.언어를_수정한다(id, data);

    this.logger.log(`언어 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 언어를 삭제한다
   */
  async 언어를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`언어 삭제 시작 - ID: ${id}`);

    const result = await this.languageContextService.언어를_삭제한다(id);

    this.logger.log(`언어 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 기본 언어들을 추가한다
   */
  async 기본_언어들을_추가한다(createdBy?: string): Promise<Language[]> {
    this.logger.log('기본 언어 추가 시작');

    const result =
      await this.languageContextService.기본_언어들을_추가한다(createdBy);

    this.logger.log(`기본 언어 추가 완료 - 총 ${result.length}개 추가됨`);

    return result;
  }
}
