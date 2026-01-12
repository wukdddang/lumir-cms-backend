import { Injectable, Logger, Inject } from '@nestjs/common';
import { ElectronicDisclosureContextService } from '@context/electronic-disclosure-context/electronic-disclosure-context.service';
import { ElectronicDisclosure } from '@domain/core/electronic-disclosure/electronic-disclosure.entity';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import type { IStorageService } from '@libs/storage/interfaces/storage.interface';

/**
 * 전자공시 비즈니스 서비스
 *
 * 전자공시 관련 비즈니스 로직을 오케스트레이션합니다.
 */
@Injectable()
export class ElectronicDisclosureBusinessService {
  private readonly logger = new Logger(ElectronicDisclosureBusinessService.name);

  constructor(
    private readonly electronicDisclosureContextService: ElectronicDisclosureContextService,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * 전자공시 전체 목록을 조회한다
   */
  async 전자공시_전체_목록을_조회한다(): Promise<ElectronicDisclosure[]> {
    this.logger.log('전자공시 전체 목록 조회 시작');

    const disclosures =
      await this.electronicDisclosureContextService.전자공시_전체_목록을_조회한다();

    this.logger.log(`전자공시 전체 목록 조회 완료 - 총 ${disclosures.length}개`);

    return disclosures;
  }

  /**
   * 전자공시 상세를 조회한다
   */
  async 전자공시_상세를_조회한다(id: string): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 상세 조회 시작 - ID: ${id}`);

    const disclosure =
      await this.electronicDisclosureContextService.전자공시_상세를_조회한다(id);

    this.logger.log(`전자공시 상세 조회 완료 - ID: ${id}`);

    return disclosure;
  }

  /**
   * 전자공시를 삭제한다
   */
  async 전자공시를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`전자공시 삭제 시작 - ID: ${id}`);

    const result =
      await this.electronicDisclosureContextService.전자공시를_삭제한다(id);

    this.logger.log(`전자공시 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 전자공시 공개를 수정한다
   */
  async 전자공시_공개를_수정한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 공개 수정 시작 - ID: ${id}, 공개: ${isPublic}`);

    const disclosure =
      await this.electronicDisclosureContextService.전자공시_공개를_수정한다(
        id,
        isPublic,
        updatedBy,
      );

    this.logger.log(`전자공시 공개 수정 완료 - ID: ${id}`);

    return disclosure;
  }

  /**
   * 전자공시 파일을 수정한다 (파일 업로드 포함)
   */
  async 전자공시_파일을_수정한다(
    id: string,
    data: {
      attachments?: Array<{
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
      }>;
      updatedBy?: string;
    },
    files?: Express.Multer.File[],
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 파일 수정 시작 - ID: ${id}`);

    // 파일 업로드 처리
    let attachments = data.attachments;
    if (files && files.length > 0) {
      this.logger.log(`${files.length}개의 파일 업로드 시작`);
      const uploadedFiles = await this.storageService.uploadFiles(
        files,
        'electronic-disclosures',
      );
      const newAttachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));

      // 기존 첨부파일과 새 첨부파일 병합
      attachments = [...(attachments || []), ...newAttachments];
      this.logger.log(`파일 업로드 완료: ${newAttachments.length}개`);
    }

    const result =
      await this.electronicDisclosureContextService.전자공시_파일을_수정한다(
        id,
        attachments || [],
        data.updatedBy,
      );

    this.logger.log(`전자공시 파일 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 전자공시 파일을 삭제한다
   */
  async 전자공시_파일을_삭제한다(
    id: string,
    fileUrls: string[],
    updatedBy?: string,
  ): Promise<ElectronicDisclosure> {
    this.logger.log(
      `전자공시 파일 삭제 시작 - ID: ${id}, 파일 수: ${fileUrls.length}`,
    );

    // 전자공시 조회
    const disclosure =
      await this.electronicDisclosureContextService.전자공시_상세를_조회한다(id);

    if (!disclosure.attachments || disclosure.attachments.length === 0) {
      this.logger.warn(`삭제할 파일이 없습니다 - ID: ${id}`);
      return disclosure;
    }

    // 스토리지에서 파일 삭제
    this.logger.log(`스토리지에서 ${fileUrls.length}개의 파일 삭제 시작`);
    await this.storageService.deleteFiles(fileUrls);
    this.logger.log(`스토리지 파일 삭제 완료`);

    // 삭제할 파일 제외한 첨부파일 목록 생성
    const remainingAttachments = disclosure.attachments.filter(
      (attachment) => !fileUrls.includes(attachment.fileUrl),
    );

    this.logger.log(
      `남은 첨부파일: ${remainingAttachments.length}개 (${disclosure.attachments.length - remainingAttachments.length}개 삭제됨)`,
    );

    // 전자공시 파일 정보 업데이트
    const result =
      await this.electronicDisclosureContextService.전자공시_파일을_수정한다(
        id,
        remainingAttachments,
        updatedBy,
      );

    this.logger.log(`전자공시 파일 삭제 완료 - ID: ${id}`);

    return result;
  }
}
