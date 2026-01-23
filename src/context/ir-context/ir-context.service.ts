import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { IRService } from '@domain/core/ir/ir.service';
import { LanguageService } from '@domain/common/language/language.service';
import { CategoryService } from '@domain/common/category/category.service';
import { IR } from '@domain/core/ir/ir.entity';
import { IRTranslationUpdatedEvent } from './events/ir-translation-updated.event';

/**
 * IR 컨텍스트 서비스
 *
 * IR 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class IRContextService {
  private readonly logger = new Logger(IRContextService.name);

  constructor(
    private readonly irService: IRService,
    private readonly languageService: LanguageService,
    private readonly categoryService: CategoryService,
    private readonly configService: ConfigService,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * IR 전체 목록을 조회한다
   */
  async IR_전체_목록을_조회한다(): Promise<IR[]> {
    return await this.irService.모든_IR을_조회한다({
      orderBy: 'order',
    });
  }

  /**
   * IR 상세를 조회한다
   */
  async IR_상세를_조회한다(id: string): Promise<IR> {
    return await this.irService.ID로_IR을_조회한다(id);
  }

  /**
   * IR을 삭제한다
   */
  async IR을_삭제한다(id: string): Promise<boolean> {
    return await this.irService.IR을_삭제한다(id);
  }

  /**
   * IR 공개 여부를 변경한다
   */
  async IR_공개를_수정한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<IR> {
    return await this.irService.IR_공개_여부를_변경한다(
      id,
      isPublic,
      updatedBy,
    );
  }

  /**
   * IR 파일을 수정한다
   */
  async IR_파일을_수정한다(
    id: string,
    attachments: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }>,
    updatedBy?: string,
  ): Promise<IR> {
    return await this.irService.IR을_업데이트한다(id, {
      attachments,
      updatedBy,
    });
  }

  /**
   * IR을 생성한다
   * 
   * 브로슈어와 동일한 다국어 전략 적용:
   * 1. 전달받은 언어: isSynced = false (사용자 입력)
   * 2. 나머지 활성 언어: isSynced = true (자동 동기화)
   */
  async IR을_생성한다(
    translations: Array<{
      languageId: string;
      title: string;
      description?: string;
    }>,
    createdBy: string | undefined,
    attachments: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }> | undefined,
    categoryId: string,
  ): Promise<IR> {
    this.logger.log(`IR 생성 시작 - 번역 수: ${translations.length}`);

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

    // 3. 카테고리 ID 검증 (필수)
    await this.categoryService.ID로_카테고리를_조회한다(categoryId);

    // 4. 모든 활성 언어 조회 (자동 동기화용)
    const allLanguages = await this.languageService.모든_언어를_조회한다(false);

    // 5. 다음 순서 계산
    const nextOrder = await this.irService.다음_순서를_계산한다();

    // 6. IR 생성 (기본값: 공개)
    const ir = await this.irService.IR을_생성한다({
      isPublic: true,
      order: nextOrder,
      categoryId,
      attachments: attachments || null,
      createdBy,
    });

    // 7. 카테고리 매핑 생성
    await this.categoryService.엔티티에_카테고리를_매핑한다(
      ir.id,
      categoryId,
      createdBy,
    );
    this.logger.log(`IR에 카테고리 매핑 완료 - 카테고리 ID: ${categoryId}`);

    // 8. 전달받은 언어들에 대한 번역 생성 (isSynced: false, 개별 설정됨)
    await this.irService.IR_번역을_생성한다(
      ir.id,
      translations.map((t) => ({
        languageId: t.languageId,
        title: t.title,
        description: t.description,
        isSynced: false, // 개별 설정
      })),
      createdBy,
    );

    // 9. 기준 번역 선정 (기본 언어 우선, 없으면 첫 번째)
    const defaultLanguageCode = this.configService.get<string>('DEFAULT_LANGUAGE_CODE', 'en');
    const defaultLang = languages.find((l) => l.code === defaultLanguageCode);
    const baseTranslation =
      translations.find((t) => t.languageId === defaultLang?.id) ||
      translations[0];

    // 10. 전달되지 않은 나머지 활성 언어들에 대한 번역 생성 (isSynced: true, 자동 동기화)
    const remainingLanguages = allLanguages.filter(
      (lang) => !languageIds.includes(lang.id),
    );

    if (remainingLanguages.length > 0) {
      await this.irService.IR_번역을_생성한다(
        ir.id,
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
      `IR 생성 완료 - ID: ${ir.id}, 전체 번역 수: ${totalTranslations} (개별: ${translations.length}, 자동: ${remainingLanguages.length})`,
    );

    // 11. 번역 포함하여 재조회
    return await this.irService.ID로_IR을_조회한다(ir.id);
  }

  /**
   * IR을 수정한다
   */
  async IR을_수정한다(
    id: string,
    data: {
      isPublic?: boolean;
      order?: number;
      categoryId?: string;
      translations?: Array<{
        id?: string;
        languageId: string;
        title: string;
        description?: string;
      }>;
      updatedBy?: string;
    },
  ): Promise<IR> {
    this.logger.log(`IR 수정 시작 - ID: ${id}`);

    // IR 업데이트
    const updateData: any = {};
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.updatedBy) updateData.updatedBy = data.updatedBy;

    if (Object.keys(updateData).length > 0) {
      await this.irService.IR을_업데이트한다(id, updateData);
    }

    // 기본 언어 조회 (이벤트 발행용)
    const baseLanguage = await this.languageService.기본_언어를_조회한다();

    // 번역 업데이트 (제공된 경우)
    if (data.translations && data.translations.length > 0) {
      for (const translation of data.translations) {
        if (translation.id) {
          // 기존 번역 업데이트 (수정 시 isSynced=false로 변경)
          await this.irService.IR_번역을_업데이트한다(translation.id, {
            title: translation.title,
            description: translation.description ?? undefined,
            isSynced: false, // 수정되었으므로 동기화 중단
            updatedBy: data.updatedBy,
          });

          // 기본 언어 번역이 수정된 경우 이벤트 발행 (동기화 트리거)
          if (baseLanguage && translation.languageId === baseLanguage.id) {
            this.logger.debug('기본 언어 번역 수정 감지 - 동기화 이벤트 발행');
            this.eventBus.publish(
              new IRTranslationUpdatedEvent(
                id,
                translation.languageId,
                translation.title,
                translation.description,
                data.updatedBy,
              ),
            );
          }
        } else {
          // 해당 언어의 번역이 이미 있는지 확인
          const existingTranslations =
            await this.irService.IR_번역을_조회한다(id);
          const existingTranslation = existingTranslations.find(
            (t) => t.languageId === translation.languageId,
          );

          if (existingTranslation) {
            // 이미 존재하면 업데이트 (수정 시 isSynced=false로 변경)
            await this.irService.IR_번역을_업데이트한다(
              existingTranslation.id,
              {
                title: translation.title,
                description: translation.description ?? undefined,
                isSynced: false, // 수정되었으므로 동기화 중단
                updatedBy: data.updatedBy,
              },
            );

            // 기본 언어 번역이 수정된 경우 이벤트 발행 (동기화 트리거)
            if (baseLanguage && translation.languageId === baseLanguage.id) {
              this.logger.debug(
                '기본 언어 번역 수정 감지 - 동기화 이벤트 발행',
              );
              this.eventBus.publish(
                new IRTranslationUpdatedEvent(
                  id,
                  translation.languageId,
                  translation.title,
                  translation.description,
                  data.updatedBy,
                ),
              );
            }
          } else {
            // 새 번역 생성
            await this.irService.IR_번역을_생성한다(
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
    return await this.irService.ID로_IR을_조회한다(id);
  }

  /**
   * IR 오더를 일괄 수정한다
   */
  async IR_오더를_일괄_수정한다(
    items: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(`IR 일괄 오더 수정 시작 - 수정할 IR 수: ${items.length}`);

    const result = await this.irService.IR_오더를_일괄_업데이트한다(
      items,
      updatedBy,
    );

    this.logger.log(
      `IR 일괄 오더 수정 완료 - 수정된 IR 수: ${result.updatedCount}`,
    );

    return result;
  }

  /**
   * IR 목록을 조회한다 (페이징)
   */
  async IR_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    items: IR[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `IR 목록 조회 - 페이지: ${page}, 개수: ${limit}, 공개: ${isPublic}`,
    );

    // 전체 목록 조회
    const allIRs = await this.irService.모든_IR을_조회한다({
      isPublic,
      orderBy,
      startDate,
      endDate,
    });

    // 페이징 적용
    const total = allIRs.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const items = allIRs.slice(skip, skip + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
