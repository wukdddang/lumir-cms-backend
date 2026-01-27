import { Injectable, Logger } from '@nestjs/common';
import { LanguageContextService } from '@context/language-context/language-context.service';
import { Language } from '@domain/common/language/language.entity';
import ISO6391 from 'iso-639-1';

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
   * 언어를 추가한다
   */
  async 언어를_추가한다(data: {
    code: string;
    name: string;
    isActive: boolean;
    createdBy?: string;
  }): Promise<Language> {
    this.logger.log(`언어 추가 시작 - 코드: ${data.code}`);

    const result = await this.languageContextService.언어를_생성한다(data);

    this.logger.log(`언어 추가 완료 - ID: ${result.id}`);

    // CreateLanguageResult를 Language로 변환하여 반환
    // 복원된 경우에도 핸들러에서 직접 반환하므로 상세 조회 불필요
    return result as Language;
  }

  /**
   * 언어를 제외한다 (Soft Delete)
   */
  async 언어를_제외한다(id: string): Promise<boolean> {
    this.logger.log(`언어 제외 시작 - ID: ${id}`);

    const result = await this.languageContextService.언어를_삭제한다(id);

    this.logger.log(`언어 제외 완료 - ID: ${id}`);

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

  /**
   * 사용 가능한 언어 코드 목록을 조회한다 (ISO 639-1)
   * 활성 상태인 언어만 제외하고, 제외된 언어는 포함한다
   */
  async 사용_가능한_언어_코드_목록을_조회한다(): Promise<
    Array<{ code: string; name: string; nativeName: string }>
  > {
    this.logger.log('언어 코드 목록 조회 시작');

    // 활성 언어만 조회 (제외된 언어는 다시 추가 가능)
    const activeLanguages =
      await this.languageContextService.언어_목록을_조회한다(false); // 활성만
    const activeCodes = new Set(
      activeLanguages.items.map((lang) => lang.code),
    );

    // 전체 ISO 639-1 코드에서 활성 언어만 제외
    const allCodes = ISO6391.getAllCodes();
    const availableCodes = allCodes.filter(
      (code) => !activeCodes.has(code),
    );

    const result = availableCodes.map((code) => ({
      code,
      name: ISO6391.getName(code),
      nativeName: ISO6391.getNativeName(code),
    }));

    this.logger.log(
      `언어 코드 목록 조회 완료 - 총 ${result.length}개 (활성 ${activeCodes.size}개 제외됨)`,
    );

    return result;
  }
}
