import { Injectable } from '@nestjs/common';
import { ElectronicDisclosureService } from '@domain/core/electronic-disclosure/electronic-disclosure.service';
import { ElectronicDisclosure } from '@domain/core/electronic-disclosure/electronic-disclosure.entity';

/**
 * 전자공시 컨텍스트 서비스
 *
 * 전자공시 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class ElectronicDisclosureContextService {
  constructor(
    private readonly electronicDisclosureService: ElectronicDisclosureService,
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
}
