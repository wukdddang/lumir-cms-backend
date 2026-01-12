import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ShareholdersMeetingService } from '@domain/core/shareholders-meeting/shareholders-meeting.service';
import { LanguageService } from '@domain/common/language/language.service';
import { ShareholdersMeeting } from '@domain/core/shareholders-meeting/shareholders-meeting.entity';
import { VoteResult } from '@domain/core/shareholders-meeting/vote-result.entity';
import { VoteResultType } from '@domain/core/shareholders-meeting/vote-result-type.types';

/**
 * 주주총회 컨텍스트 서비스
 *
 * 주주총회 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class ShareholdersMeetingContextService {
  private readonly logger = new Logger(ShareholdersMeetingContextService.name);

  constructor(
    private readonly shareholdersMeetingService: ShareholdersMeetingService,
    private readonly languageService: LanguageService,
  ) {}

  /**
   * 주주총회 전체 목록을 조회한다
   */
  async 주주총회_전체_목록을_조회한다(): Promise<ShareholdersMeeting[]> {
    return await this.shareholdersMeetingService.모든_주주총회를_조회한다({
      orderBy: 'order',
    });
  }

  /**
   * 주주총회 상세를 조회한다
   */
  async 주주총회_상세를_조회한다(id: string): Promise<ShareholdersMeeting> {
    return await this.shareholdersMeetingService.ID로_주주총회를_조회한다(id);
  }

  /**
   * 주주총회를 삭제한다
   */
  async 주주총회를_삭제한다(id: string): Promise<boolean> {
    return await this.shareholdersMeetingService.주주총회를_삭제한다(id);
  }

  /**
   * 주주총회 공개 여부를 변경한다
   */
  async 주주총회_공개를_수정한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<ShareholdersMeeting> {
    return await this.shareholdersMeetingService.주주총회_공개_여부를_변경한다(
      id,
      isPublic,
      updatedBy,
    );
  }

  /**
   * 주주총회 파일을 수정한다
   */
  async 주주총회_파일을_수정한다(
    id: string,
    attachments: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }>,
    updatedBy?: string,
  ): Promise<ShareholdersMeeting> {
    return await this.shareholdersMeetingService.주주총회를_업데이트한다(id, {
      attachments,
      updatedBy,
    });
  }

  /**
   * 주주총회를 생성한다
   *
   * ElectronicDisclosure, IR과 동일한 다국어 전략 적용:
   * 1. 전달받은 언어: isSynced = false (사용자 입력)
   * 2. 나머지 활성 언어: isSynced = true (자동 동기화)
   */
  async 주주총회를_생성한다(
    translations: Array<{
      languageId: string;
      title: string;
      description?: string;
    }>,
    meetingData: {
      location: string;
      meetingDate: Date;
    },
    voteResults?: Array<{
      agendaNumber: number;
      totalVote: number;
      yesVote: number;
      noVote: number;
      approvalRating: number;
      result: VoteResultType;
      translations: Array<{
        languageId: string;
        title: string;
      }>;
    }>,
    createdBy?: string,
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }>,
  ): Promise<ShareholdersMeeting> {
    this.logger.log(`주주총회 생성 시작 - 번역 수: ${translations.length}`);

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
    const nextOrder =
      await this.shareholdersMeetingService.다음_순서를_계산한다();

    // 5. 주주총회 생성 (기본값: 비공개, DRAFT 상태)
    const meeting = await this.shareholdersMeetingService.주주총회를_생성한다({
      isPublic: false,
      status: 'draft' as any,
      order: nextOrder,
      location: meetingData.location,
      meetingDate: meetingData.meetingDate,
      attachments: attachments || null,
      createdBy,
    });

    // 6. 전달받은 언어들에 대한 번역 생성 (isSynced: false, 개별 설정됨)
    await this.shareholdersMeetingService.주주총회_번역을_생성한다(
      meeting.id,
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
      await this.shareholdersMeetingService.주주총회_번역을_생성한다(
        meeting.id,
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
      `주주총회 생성 완료 - ID: ${meeting.id}, 전체 번역 수: ${totalTranslations} (개별: ${translations.length}, 자동: ${remainingLanguages.length})`,
    );

    // 9. 의결 결과(안건) 생성
    if (voteResults && voteResults.length > 0) {
      this.logger.log(`의결 결과 생성 시작 - 안건 수: ${voteResults.length}`);

      for (const voteResultData of voteResults) {
        // 의결 결과 생성
        const voteResult =
          await this.shareholdersMeetingService.의결_결과를_생성한다(
            meeting.id,
            {
              agendaNumber: voteResultData.agendaNumber,
              totalVote: voteResultData.totalVote,
              yesVote: voteResultData.yesVote,
              noVote: voteResultData.noVote,
              approvalRating: voteResultData.approvalRating,
              result: voteResultData.result,
              createdBy,
            },
          );

        // 의결 결과 번역 생성 (전달받은 언어)
        const voteResultTranslationLanguageIds =
          voteResultData.translations.map((t) => t.languageId);

        await this.shareholdersMeetingService.의결_결과_번역을_생성한다(
          voteResult.id,
          voteResultData.translations.map((t) => ({
            languageId: t.languageId,
            title: t.title,
            isSynced: false,
          })),
          createdBy,
        );

        // 나머지 언어에 대한 자동 동기화 번역 생성
        const baseVoteResultTranslation =
          voteResultData.translations.find(
            (t) => t.languageId === koreanLang?.id,
          ) || voteResultData.translations[0];

        const remainingVoteResultLanguages = allLanguages.filter(
          (lang) => !voteResultTranslationLanguageIds.includes(lang.id),
        );

        if (remainingVoteResultLanguages.length > 0) {
          await this.shareholdersMeetingService.의결_결과_번역을_생성한다(
            voteResult.id,
            remainingVoteResultLanguages.map((lang) => ({
              languageId: lang.id,
              title: baseVoteResultTranslation.title,
              isSynced: true,
            })),
            createdBy,
          );
        }
      }

      this.logger.log(`의결 결과 생성 완료 - 안건 수: ${voteResults.length}`);
    }

    // 10. 번역 포함하여 재조회
    return await this.shareholdersMeetingService.ID로_주주총회를_조회한다(
      meeting.id,
    );
  }

  /**
   * 주주총회를 수정한다
   */
  async 주주총회를_수정한다(
    id: string,
    data: {
      location?: string;
      meetingDate?: Date;
      isPublic?: boolean;
      status?: string;
      order?: number;
      translations?: Array<{
        id?: string;
        languageId: string;
        title: string;
        description?: string;
      }>;
      voteResults?: Array<{
        id?: string; // 기존 안건 수정용
        agendaNumber: number;
        totalVote: number;
        yesVote: number;
        noVote: number;
        approvalRating: number;
        result: VoteResultType;
        translations: Array<{
          id?: string;
          languageId: string;
          title: string;
        }>;
      }>;
      updatedBy?: string;
    },
  ): Promise<ShareholdersMeeting> {
    this.logger.log(`주주총회 수정 시작 - ID: ${id}`);

    // 주주총회 기본 정보 업데이트
    const updateData: any = {};
    if (data.location !== undefined) updateData.location = data.location;
    if (data.meetingDate !== undefined)
      updateData.meetingDate = data.meetingDate;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.status) updateData.status = data.status;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.updatedBy) updateData.updatedBy = data.updatedBy;

    if (Object.keys(updateData).length > 0) {
      await this.shareholdersMeetingService.주주총회를_업데이트한다(
        id,
        updateData,
      );
    }

    // 번역 업데이트 (제공된 경우)
    if (data.translations && data.translations.length > 0) {
      for (const translation of data.translations) {
        if (translation.id) {
          // 기존 번역 업데이트
          await this.shareholdersMeetingService.주주총회_번역을_업데이트한다(
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
            await this.shareholdersMeetingService.주주총회_번역을_조회한다(id);
          const existingTranslation = existingTranslations.find(
            (t) => t.languageId === translation.languageId,
          );

          if (existingTranslation) {
            // 이미 존재하면 업데이트
            await this.shareholdersMeetingService.주주총회_번역을_업데이트한다(
              existingTranslation.id,
              {
                title: translation.title,
                description: translation.description ?? undefined,
                updatedBy: data.updatedBy,
              },
            );
          } else {
            // 새 번역 생성
            await this.shareholdersMeetingService.주주총회_번역을_생성한다(
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

    // 의결 결과(안건) 업데이트 (제공된 경우)
    if (data.voteResults && data.voteResults.length > 0) {
      this.logger.log(
        `의결 결과 업데이트 시작 - 안건 수: ${data.voteResults.length}`,
      );

      // 기존 의결 결과 조회
      const existingVoteResults =
        await this.shareholdersMeetingService.의결_결과를_조회한다(id);

      // 전달된 안건 ID 목록
      const voteResultIdsToKeep = data.voteResults
        .filter((vr) => vr.id)
        .map((vr) => vr.id!);

      // 전달되지 않은 기존 안건 삭제
      for (const existingVoteResult of existingVoteResults) {
        if (!voteResultIdsToKeep.includes(existingVoteResult.id)) {
          await this.shareholdersMeetingService.의결_결과를_삭제한다(
            existingVoteResult.id,
          );
        }
      }

      // 의결 결과 생성/수정
      for (const voteResultData of data.voteResults) {
        if (voteResultData.id) {
          // 기존 안건 업데이트
          await this.shareholdersMeetingService.의결_결과를_업데이트한다(
            voteResultData.id,
            {
              agendaNumber: voteResultData.agendaNumber,
              totalVote: voteResultData.totalVote,
              yesVote: voteResultData.yesVote,
              noVote: voteResultData.noVote,
              approvalRating: voteResultData.approvalRating,
              result: voteResultData.result,
              updatedBy: data.updatedBy,
            },
          );

          // 안건 번역 업데이트
          for (const translation of voteResultData.translations) {
            if (translation.id) {
              // 기존 번역 업데이트
              await this.shareholdersMeetingService.의결_결과_번역을_업데이트한다(
                translation.id,
                {
                  title: translation.title,
                  updatedBy: data.updatedBy,
                },
              );
            } else {
              // 해당 언어의 번역이 이미 있는지 확인
              const existingTranslations =
                await this.shareholdersMeetingService.의결_결과_번역을_조회한다(
                  voteResultData.id,
                );
              const existingTranslation = existingTranslations.find(
                (t) => t.languageId === translation.languageId,
              );

              if (existingTranslation) {
                // 이미 존재하면 업데이트
                await this.shareholdersMeetingService.의결_결과_번역을_업데이트한다(
                  existingTranslation.id,
                  {
                    title: translation.title,
                    updatedBy: data.updatedBy,
                  },
                );
              } else {
                // 새 번역 생성
                await this.shareholdersMeetingService.의결_결과_번역을_생성한다(
                  voteResultData.id,
                  [
                    {
                      languageId: translation.languageId,
                      title: translation.title,
                      isSynced: false,
                    },
                  ],
                  data.updatedBy,
                );
              }
            }
          }
        } else {
          // 새 안건 생성
          const voteResult =
            await this.shareholdersMeetingService.의결_결과를_생성한다(id, {
              agendaNumber: voteResultData.agendaNumber,
              totalVote: voteResultData.totalVote,
              yesVote: voteResultData.yesVote,
              noVote: voteResultData.noVote,
              approvalRating: voteResultData.approvalRating,
              result: voteResultData.result,
              createdBy: data.updatedBy,
            });

          // 안건 번역 생성
          await this.shareholdersMeetingService.의결_결과_번역을_생성한다(
            voteResult.id,
            voteResultData.translations.map((t) => ({
              languageId: t.languageId,
              title: t.title,
              isSynced: false,
            })),
            data.updatedBy,
          );

          // 나머지 언어에 대한 자동 동기화 번역 생성
          const allLanguages =
            await this.languageService.모든_언어를_조회한다(false);
          const providedLanguageIds = voteResultData.translations.map(
            (t) => t.languageId,
          );
          const remainingLanguages = allLanguages.filter(
            (lang) => !providedLanguageIds.includes(lang.id),
          );

          if (remainingLanguages.length > 0) {
            const baseTranslation = voteResultData.translations[0];
            await this.shareholdersMeetingService.의결_결과_번역을_생성한다(
              voteResult.id,
              remainingLanguages.map((lang) => ({
                languageId: lang.id,
                title: baseTranslation.title,
                isSynced: true,
              })),
              data.updatedBy,
            );
          }
        }
      }

      this.logger.log(
        `의결 결과 업데이트 완료 - 안건 수: ${data.voteResults.length}`,
      );
    }

    // 번역 포함하여 재조회
    return await this.shareholdersMeetingService.ID로_주주총회를_조회한다(id);
  }

  /**
   * 주주총회 오더를 일괄 수정한다
   */
  async 주주총회_오더를_일괄_수정한다(
    items: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `주주총회 일괄 오더 수정 시작 - 수정할 주주총회 수: ${items.length}`,
    );

    const result =
      await this.shareholdersMeetingService.주주총회_오더를_일괄_업데이트한다(
        items,
        updatedBy,
      );

    this.logger.log(
      `주주총회 일괄 오더 수정 완료 - 수정된 주주총회 수: ${result.updatedCount}`,
    );

    return result;
  }

  /**
   * 주주총회 목록을 조회한다 (페이징)
   */
  async 주주총회_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'meetingDate' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: ShareholdersMeeting[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `주주총회 목록 조회 - 페이지: ${page}, 개수: ${limit}, 공개: ${isPublic}`,
    );

    // 전체 목록 조회
    const allMeetings =
      await this.shareholdersMeetingService.모든_주주총회를_조회한다({
        isPublic,
        orderBy,
      });

    // 페이징 적용
    const total = allMeetings.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const items = allMeetings.slice(skip, skip + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
