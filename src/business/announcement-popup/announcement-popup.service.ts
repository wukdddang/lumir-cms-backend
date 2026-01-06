import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnouncementPopup } from '@domain/core/announcement-popup/announcement-popup.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import type { AnnouncementPopupDto } from '@domain/core/announcement-popup/announcement-popup.types';
import {
  successResponse,
  type ApiResponse,
} from '@domain/common/types/api-response.types';

/**
 * 공지사항 팝업 비즈니스 서비스
 *
 * @description
 * - AnnouncementPopup Entity와 AnnouncementPopupDto 간의 변환을 담당합니다.
 * - 공지사항 팝업 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class AnnouncementPopupService {
  constructor(
    @InjectRepository(AnnouncementPopup)
    private readonly popupRepository: Repository<AnnouncementPopup>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  /**
   * 팝업 목록을 조회한다
   */
  async 팝업_목록을_조회_한다(): Promise<
    ApiResponse<AnnouncementPopupDto[]>
  > {
    const popups = await this.popupRepository.find({
      relations: ['manager'],
      order: {
        createdAt: 'DESC',
      },
    });

    const popupDtos = popups.map((popup) => popup.DTO로_변환한다());

    return successResponse(
      popupDtos,
      '팝업 목록을 성공적으로 조회했습니다.',
    );
  }

  /**
   * 팝업 상세 정보를 조회한다
   */
  async 팝업을_조회_한다(
    popupId: string,
  ): Promise<ApiResponse<AnnouncementPopupDto>> {
    const popup = await this.popupRepository.findOne({
      where: { id: popupId },
      relations: ['manager'],
    });

    if (!popup) {
      throw new Error(`팝업을 찾을 수 없습니다. ID: ${popupId}`);
    }

    return successResponse(
      popup.DTO로_변환한다(),
      '팝업 정보를 성공적으로 조회했습니다.',
    );
  }

  /**
   * 팝업을 생성한다
   */
  async 팝업을_생성_한다(
    data: Partial<AnnouncementPopupDto> & { managerId?: string },
  ): Promise<ApiResponse<AnnouncementPopupDto>> {
    // managerId가 제공된 경우 Employee 객체로 변환
    let manager: Employee | undefined;
    if (data.managerId) {
      manager = (await this.employeeRepository.findOne({
        where: { id: data.managerId },
      })) ?? undefined;

      if (!manager) {
        throw new Error(`관리자를 찾을 수 없습니다. ID: ${data.managerId}`);
      }
    }

    // DTO에서 managerId 제거하고 manager 객체 추가
    const { managerId, ...restData } = data;
    
    // tags와 attachments를 명시적으로 처리
    const entityData: any = {
      title: restData.title,
      status: restData.status,
      isPublic: restData.isPublic,
      category: restData.category,
      language: restData.language,
      tags: Array.isArray(restData.tags) ? restData.tags : [],
      attachments: Array.isArray(restData.attachments) ? restData.attachments : [],
      releasedAt: restData.releasedAt,
      ...(manager && { manager }),
    };

    const popup = this.popupRepository.create(entityData);
    const savedPopup = await this.popupRepository.save(popup);
    
    const result = Array.isArray(savedPopup) ? savedPopup[0] : savedPopup;

    // 생성 후 다시 조회하여 manager 정보 포함
    const createdPopup = await this.popupRepository.findOne({
      where: { id: result.id },
      relations: ['manager'],
    });

    if (!createdPopup) {
      throw new Error('팝업 생성 후 조회에 실패했습니다.');
    }

    return successResponse(
      createdPopup.DTO로_변환한다(),
      '팝업이 성공적으로 생성되었습니다.',
    );
  }

  /**
   * 팝업을 수정한다
   */
  async 팝업을_수정_한다(
    popupId: string,
    data: Partial<AnnouncementPopupDto> & { managerId?: string },
  ): Promise<ApiResponse<AnnouncementPopupDto>> {
    const popup = await this.popupRepository.findOne({
      where: { id: popupId },
      relations: ['manager'],
    });

    if (!popup) {
      throw new Error(`팝업을 찾을 수 없습니다. ID: ${popupId}`);
    }

    // managerId가 제공된 경우 Employee 객체로 변환
    let manager: Employee | undefined;
    if (data.managerId) {
      manager = (await this.employeeRepository.findOne({
        where: { id: data.managerId },
      })) ?? undefined;

      if (!manager) {
        throw new Error(`관리자를 찾을 수 없습니다. ID: ${data.managerId}`);
      }
    }

    // DTO에서 managerId 제거하고 manager 객체 추가
    const { managerId, ...restData } = data;
    
    // undefined 값을 제거하여 기존 필드가 덮어써지지 않도록 함
    const updateData = Object.entries({
      ...restData,
      ...(manager && { manager }),
    }).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    Object.assign(popup, updateData);
    const updatedPopup = await this.popupRepository.save(popup);

    return successResponse(
      updatedPopup.DTO로_변환한다(),
      '팝업이 성공적으로 수정되었습니다.',
    );
  }

  /**
   * 팝업을 삭제한다 (Soft Delete)
   */
  async 팝업을_삭제_한다(popupId: string): Promise<ApiResponse<void>> {
    // 먼저 팝업이 존재하는지 확인 (이미 삭제된 것도 포함)
    const popup = await this.popupRepository.findOne({
      where: { id: popupId },
      withDeleted: true, // 삭제된 것도 조회
    });

    if (!popup) {
      throw new Error(`팝업을 찾을 수 없습니다. ID: ${popupId}`);
    }

    // 이미 삭제된 경우
    if (popup.deletedAt) {
      throw new Error(`팝업을 찾을 수 없습니다. ID: ${popupId}`);
    }

    const result = await this.popupRepository.softDelete(popupId);

    if (result.affected === 0) {
      throw new Error(`팝업을 찾을 수 없습니다. ID: ${popupId}`);
    }

    return successResponse(
      undefined as any,
      '팝업이 성공적으로 삭제되었습니다.',
    );
  }

  /**
   * 팝업을 공개한다
   */
  async 팝업을_공개_한다(
    popupId: string,
  ): Promise<ApiResponse<AnnouncementPopupDto>> {
    const popup = await this.popupRepository.findOne({
      where: { id: popupId },
      relations: ['manager'],
    });

    if (!popup) {
      throw new Error(`팝업을 찾을 수 없습니다. ID: ${popupId}`);
    }

    popup.공개한다();
    const updatedPopup = await this.popupRepository.save(popup);

    return successResponse(
      updatedPopup.DTO로_변환한다(),
      '팝업이 성공적으로 공개되었습니다.',
    );
  }

  /**
   * 팝업을 비공개한다
   */
  async 팝업을_비공개_한다(
    popupId: string,
  ): Promise<ApiResponse<AnnouncementPopupDto>> {
    const popup = await this.popupRepository.findOne({
      where: { id: popupId },
      relations: ['manager'],
    });

    if (!popup) {
      throw new Error(`팝업을 찾을 수 없습니다. ID: ${popupId}`);
    }

    popup.비공개한다();
    const updatedPopup = await this.popupRepository.save(popup);

    return successResponse(
      updatedPopup.DTO로_변환한다(),
      '팝업이 성공적으로 비공개되었습니다.',
    );
  }
}
