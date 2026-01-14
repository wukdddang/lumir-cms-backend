import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ElectronicDisclosureService } from '@domain/core/electronic-disclosure/electronic-disclosure.service';
import { LanguageService } from '@domain/common/language/language.service';
import { ElectronicDisclosure } from '@domain/core/electronic-disclosure/electronic-disclosure.entity';

/**
 * 전자공시 컨텍스트 서비스
 *
 * 전자공시 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class ElectronicDisclosureContextService {
  private readonly logger = new Logger(ElectronicDisclosureContextService.name);

  constructor(
    private readonly electronicDisclosureService: ElectronicDisclosureService,
    private readonly languageService: LanguageService,
  ) {}

  /**
   * 전자공시 전체 목록을 조회한다
   */
  async 전자공시_전체_목록을_조회한다(): Promise<ElectronicDisclosure[]> {
    return await this.electronicDisclosureService.모든_전자공시를_조회한다({
      orderBy: 'order',
    });
  }

  /**
   * 전자공시 상세를 조회한다
   */
  async 전자공시_상세를_조회한다(id: string): Promise<ElectronicDisclosure> {
    return await this.electronicDisclosureService.ID로_전자공시를_조회한다(id);
  }

  /**
   * 전자공시를 삭제한다
   */
  async 전자공시를_삭제한다(id: string): Promise<boolean> {
    return await this.electronicDisclosureService.전자공시를_삭제한다(id);
  }

  /**
   * 전자공시 공개 여부를 변경한다
   */
  async 전자공시_공개를_수정한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<ElectronicDisclosure> {
    return await this.electronicDisclosureService.전자공시_공개_여부를_변경한다(
      id,
      isPublic,
      updatedBy,
    );
  }

  /**
   * 전자공시 파일을 수정한다
   */
  async 전자공시_파일을_수정한다(
    id: string,
    attachments: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }>,
    updatedBy?: string,
  ): Promise<ElectronicDisclosure> {
    return await this.electronicDisclosureService.전자공시를_업데이트한다(id, {
      attachments,
      updatedBy,
    });
  }

  /**
   * 전자공시를 생성한다
   * 
   * 브로슈어와 동일한 다국어 전략 적용:
   * 1. 전달받은 언어: isSynced = false (사용자 입력)
   * 2. 나머지 활성 언어: isSynced = true (자동 동기화)
   */
  async 전자공시를_생성한다(
    translations: Array<{
      languageId: string;
      title: string;
      description?: string;
    }>,
    createdBy?: string,
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }>,
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 생성 시작 - 번역 수: ${translations.length}`);

    // 1. 언어 ID 검증
    const languageIds = translations.map((t) => t.languageId);
    const languages = await Promise.all(
      languageIds.map((id) => this.languageService.ID로_언어를_조회한다(id)),
    );

    // 2. 중복 언어 체크
    const uniqueLanguageIds = new Set(languageIds);
    if (uniqueLanguageIds.size !== languageIds.length) {
      throw new BadRequestException('중복된 언어 ID가 있습니다.');
    }

    // 3. 모든 활성 언어 조회 (자동 동기화용)
    const allLanguages = await this.languageService.모든_언어를_조회한다(false);

    // 4. 다음 순서 계산
    const nextOrder = await this.electronicDisclosureService.다음_순서를_계산한다();

    // 5. 전자공시 생성 (기본값: 공개)
    const disclosure = await this.electronicDisclosureService.전자공시를_생성한다({
      isPublic: true,
      order: nextOrder,
      attachments: attachments || null,
      createdBy,
    });

    // 6. 전달받은 언어들에 대한 번역 생성 (isSynced: false, 개별 설정됨)
    await this.electronicDisclosureService.전자공시_번역을_생성한다(
      disclosure.id,
      translations.map((t) => ({
        languageId: t.languageId,
        title: t.title,
        description: t.description,
        isSynced: false, // 개별 설정
      })),
      createdBy,
    );

    // 7. 기준 번역 선정 (한국어 우선, 없으면 첫 번째)
    const koreanLang = languages.find((l) => l.code === 'ko');
    const baseTranslation =
      translations.find((t) => t.languageId === koreanLang?.id) ||
      translations[0];

    // 8. 전달되지 않은 나머지 활성 언어들에 대한 번역 생성 (isSynced: true, 자동 동기화)
    const remainingLanguages = allLanguages.filter(
      (lang) => !languageIds.includes(lang.id),
    );

    if (remainingLanguages.length > 0) {
      await this.electronicDisclosureService.전자공시_번역을_생성한다(
        disclosure.id,
        remainingLanguages.map((lang) => ({
          languageId: lang.id,
          title: baseTranslation.title,
          description: baseTranslation.description,
          isSynced: true, // 자동 동기화
        })),
        createdBy,
      );
    }

    const totalTranslations = translations.length + remainingLanguages.length;
    this.logger.log(
      `전자공시 생성 완료 - ID: ${disclosure.id}, 전체 번역 수: ${totalTranslations} (개별: ${translations.length}, 자동: ${remainingLanguages.length})`,
    );

    // 9. 번역 포함하여 재조회
    return await this.electronicDisclosureService.ID로_전자공시를_조회한다(
      disclosure.id,
    );
  }

  /**
   * 전자공시를 수정한다
   */
  async 전자공시를_수정한다(
    id: string,
    data: {
      isPublic?: boolean;
      order?: number;
      translations?: Array<{
        id?: string;
        languageId: string;
        title: string;
        description?: string;
      }>;
      updatedBy?: string;
    },
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 수정 시작 - ID: ${id}`);

    // 전자공시 업데이트
    const updateData: any = {};
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.updatedBy) updateData.updatedBy = data.updatedBy;

    if (Object.keys(updateData).length > 0) {
      await this.electronicDisclosureService.전자공시를_업데이트한다(
        id,
        updateData,
      );
    }

    // 번역 업데이트 (제공된 경우)
    if (data.translations && data.translations.length > 0) {
      for (const translation of data.translations) {
        if (translation.id) {
          // 기존 번역 업데이트
          await this.electronicDisclosureService.전자공시_번역을_업데이트한다(
            translation.id,
            {
              title: translation.title,
              description: translation.description ?? undefined,
              updatedBy: data.updatedBy,
            },
          );
        } else {
          // 해당 언어의 번역이 이미 있는지 확인
          const existingTranslations =
            await this.electronicDisclosureService.전자공시_번역을_조회한다(id);
          const existingTranslation = existingTranslations.find(
            (t) => t.languageId === translation.languageId,
          );

          if (existingTranslation) {
            // 이미 존재하면 업데이트
            await this.electronicDisclosureService.전자공시_번역을_업데이트한다(
              existingTranslation.id,
              {
                title: translation.title,
                description: translation.description ?? undefined,
                updatedBy: data.updatedBy,
              },
            );
          } else {
            // 새 번역 생성
            await this.electronicDisclosureService.전자공시_번역을_생성한다(
              id,
              [
                {
                  languageId: translation.languageId,
                  title: translation.title,
                  description: translation.description,
                  isSynced: false,
                },
              ],
              data.updatedBy,
            );
          }
        }
      }
    }

    // 번역 포함하여 재조회
    return await this.electronicDisclosureService.ID로_전자공시를_조회한다(id);
  }

  /**
   * 전자공시 오더를 일괄 수정한다
   */
  async 전자공시_오더를_일괄_수정한다(
    items: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `전자공시 일괄 오더 수정 시작 - 수정할 전자공시 수: ${items.length}`,
    );

    const result =
      await this.electronicDisclosureService.전자공시_오더를_일괄_업데이트한다(
        items,
        updatedBy,
      );

    this.logger.log(
      `전자공시 일괄 오더 수정 완료 - 수정된 전자공시 수: ${result.updatedCount}`,
    );

    return result;
  }

  /**
   * 전자공시 목록을 조회한다 (페이징)
   */
  async 전자공시_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: ElectronicDisclosure[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `전자공시 목록 조회 - 페이지: ${page}, 개수: ${limit}, 공개: ${isPublic}`,
    );

    // 전체 목록 조회
    const allDisclosures =
      await this.electronicDisclosureService.모든_전자공시를_조회한다({
        isPublic,
        orderBy,
      });

    // 페이징 적용
    const total = allDisclosures.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const items = allDisclosures.slice(skip, skip + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
