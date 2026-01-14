import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { AnnouncementContextService } from '@context/announcement-context/announcement-context.service';
import { CompanyContextService } from '@context/company-context/company-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { Announcement } from '@domain/core/announcement/announcement.entity';
import { AnnouncementRead } from '@domain/core/announcement/announcement-read.entity';
import { Survey } from '@domain/sub/survey/survey.entity';
import { SurveyCompletion } from '@domain/sub/survey/survey-completion.entity';
import { Category } from '@domain/common/category/category.entity';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from '@context/announcement-context/interfaces/announcement-context.interface';
import {
  OrganizationInfo,
  DepartmentListResult,
  RankListResult,
  PositionListResult,
} from '@context/company-context/interfaces/company-context.interface';

/**
 * 공지사항 비즈니스 서비스
 *
 * 공지사항 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 여러 컨텍스트 간 조율
 * - SSO 조직 정보 연동
 */
@Injectable()
export class AnnouncementBusinessService {
  private readonly logger = new Logger(AnnouncementBusinessService.name);

  private readonly ssoBaseUrl: string;
  private readonly notificationBaseUrl: string;

  constructor(
    private readonly announcementContextService: AnnouncementContextService,
    private readonly companyContextService: CompanyContextService,
    private readonly categoryService: CategoryService,
    private readonly configService: ConfigService,
    @InjectRepository(AnnouncementRead)
    private readonly announcementReadRepository: Repository<AnnouncementRead>,
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(SurveyCompletion)
    private readonly surveyCompletionRepository: Repository<SurveyCompletion>,
  ) {
    this.ssoBaseUrl = this.configService.get<string>('SSO_API_URL') || '';
    this.notificationBaseUrl = this.configService.get<string>(
      'NOTIFICATION_API_URL',
    ) || '';
  }

  /**
   * 공지사항 목록을 조회한다
   */
  async 공지사항_목록을_조회한다(params: {
    isPublic?: boolean;
    isFixed?: boolean;
    orderBy?: 'order' | 'createdAt';
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    items: Announcement[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log('공지사항 목록 조회 시작');

    const result =
      await this.announcementContextService.공지사항_목록을_조회한다(params);

    this.logger.log(`공지사항 목록 조회 완료 - 총 ${result.total}개`);

    return result;
  }

  /**
   * 공지사항 전체 목록을 조회한다 (페이지네이션 없음)
   */
  async 공지사항_전체_목록을_조회한다(): Promise<Announcement[]> {
    this.logger.log('공지사항 전체 목록 조회 시작');

    // 매우 큰 limit을 사용하여 전체 목록 조회
    const result =
      await this.announcementContextService.공지사항_목록을_조회한다({
        limit: 10000,
      });

    this.logger.log(`공지사항 전체 목록 조회 완료 - 총 ${result.total}개`);

    return result.items;
  }

  /**
   * 공지사항을 조회한다
   */
  async 공지사항을_조회한다(id: string): Promise<Announcement> {
    this.logger.log(`공지사항 조회 시작 - ID: ${id}`);

    const announcement =
      await this.announcementContextService.공지사항을_조회한다(id);

    this.logger.log(`공지사항 조회 완료 - ID: ${id}`);

    return announcement;
  }

  /**
   * 공지사항을 생성한다
   */
  async 공지사항을_생성한다(
    data: CreateAnnouncementDto,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 생성 시작 - 제목: ${data.title}`);

    const result =
      await this.announcementContextService.공지사항을_생성한다(data);

    this.logger.log(`공지사항 생성 완료 - ID: ${result.id}`);

    // 생성 후 상세 정보 조회
    return await this.announcementContextService.공지사항을_조회한다(result.id);
  }

  /**
   * 공지사항을 수정한다
   */
  async 공지사항을_수정한다(
    id: string,
    data: UpdateAnnouncementDto,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 수정 시작 - ID: ${id}`);

    const result =
      await this.announcementContextService.공지사항을_수정한다(id, data);

    this.logger.log(`공지사항 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 공지사항_공개를_수정한다
   */
  async 공지사항_공개를_수정한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 공개 상태 수정 시작 - ID: ${id}, 공개: ${isPublic}`);

    const result =
      await this.announcementContextService.공지사항_공개를_수정한다(id, {
        isPublic,
        updatedBy,
      });

    this.logger.log(`공지사항 공개 상태 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 공지사항_고정을_수정한다
   */
  async 공지사항_고정을_수정한다(
    id: string,
    isFixed: boolean,
    updatedBy?: string,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 고정 상태 수정 시작 - ID: ${id}, 고정: ${isFixed}`);

    const result =
      await this.announcementContextService.공지사항_고정을_수정한다(id, {
        isFixed,
        updatedBy,
      });

    this.logger.log(`공지사항 고정 상태 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 공지사항_오더를_수정한다
   */
  async 공지사항_오더를_수정한다(
    id: string,
    order: number,
    updatedBy?: string,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 오더 수정 시작 - ID: ${id}, Order: ${order}`);

    const result =
      await this.announcementContextService.공지사항_오더를_수정한다(id, {
        order,
        updatedBy,
      });

    this.logger.log(`공지사항 오더 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 공지사항 오더를 일괄 수정한다
   */
  async 공지사항_오더를_일괄_수정한다(
    announcements: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `공지사항 일괄 오더 수정 시작 - 수정할 공지사항 수: ${announcements.length}`,
    );

    const result =
      await this.announcementContextService.공지사항_오더를_일괄_수정한다({
        announcements,
        updatedBy,
      });

    this.logger.log(
      `공지사항 일괄 오더 수정 완료 - 수정된 공지사항 수: ${result.updatedCount}`,
    );

    return result;
  }

  /**
   * 공지사항을 삭제한다
   */
  async 공지사항을_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`공지사항 삭제 시작 - ID: ${id}`);

    const result = await this.announcementContextService.공지사항을_삭제한다(id);

    this.logger.log(`공지사항 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 조직 정보를 가져온다 (SSO)
   */
  async 조직_정보를_가져온다(): Promise<OrganizationInfo> {
    this.logger.log('조직 정보 조회 시작 (SSO)');

    const result = await this.companyContextService.조직_정보를_가져온다();

    this.logger.log('조직 정보 조회 완료 (SSO)');

    return result;
  }

  /**
   * 부서 정보를 가져온다 (SSO)
   */
  async 부서_정보를_가져온다(): Promise<DepartmentListResult> {
    this.logger.log('부서 정보 조회 시작 (SSO)');

    const result = await this.companyContextService.부서_정보를_가져온다();

    this.logger.log('부서 정보 조회 완료 (SSO)');

    return result;
  }

  /**
   * 직급 정보를 가져온다 (SSO)
   */
  async 직급_정보를_가져온다(): Promise<RankListResult> {
    this.logger.log('직급 정보 조회 시작 (SSO)');

    const result = await this.companyContextService.직급_정보를_가져온다();

    this.logger.log('직급 정보 조회 완료 (SSO)');

    return result;
  }

  /**
   * 직책 정보를 가져온다 (SSO)
   */
  async 직책_정보를_가져온다(): Promise<PositionListResult> {
    this.logger.log('직책 정보 조회 시작 (SSO)');

    const result = await this.companyContextService.직책_정보를_가져온다();

    this.logger.log('직책 정보 조회 완료 (SSO)');

    return result;
  }

  /**
   * 공지사항 카테고리 목록을 조회한다
   */
  async 공지사항_카테고리_목록을_조회한다(): Promise<Category[]> {
    this.logger.log('공지사항 카테고리 목록 조회 시작');

    const categories =
      await this.categoryService.엔티티_타입별_카테고리를_조회한다(
        CategoryEntityType.ANNOUNCEMENT,
        false, // 활성화된 것만
      );

    this.logger.log(`공지사항 카테고리 목록 조회 완료 - 총 ${categories.length}개`);

    return categories;
  }

  /**
   * 공지사항 카테고리를 생성한다
   */
  async 공지사항_카테고리를_생성한다(data: {
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    createdBy?: string;
  }): Promise<Category> {
    this.logger.log(`공지사항 카테고리 생성 시작 - 이름: ${data.name}`);

    const newCategory = await this.categoryService.카테고리를_생성한다({
      entityType: CategoryEntityType.ANNOUNCEMENT,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    this.logger.log(`공지사항 카테고리 생성 완료 - ID: ${newCategory.id}`);

    return newCategory;
  }

  /**
   * 공지사항 카테고리를 수정한다
   */
  async 공지사항_카테고리를_수정한다(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      order?: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`공지사항 카테고리 수정 시작 - ID: ${id}`);

    const updatedCategory = await this.categoryService.카테고리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`공지사항 카테고리 수정 완료 - ID: ${id}`);

    return updatedCategory;
  }

  /**
   * 공지사항 카테고리 오더를 변경한다
   */
  async 공지사항_카테고리_오더를_변경한다(
    id: string,
    data: {
      order: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`공지사항 카테고리 오더 변경 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_업데이트한다(id, {
      order: data.order,
      updatedBy: data.updatedBy,
    });

    this.logger.log(`공지사항 카테고리 오더 변경 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 공지사항 카테고리를 삭제한다
   */
  async 공지사항_카테고리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`공지사항 카테고리 삭제 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_삭제한다(id);

    this.logger.log(`공지사항 카테고리 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 공지사항에_포함된_전체직원에게_알림을보낸다
   */
  async 공지사항에_포함된_전체직원에게_알림을보낸다(
    announcementId: string,
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    this.logger.log(
      `공지사항 포함된 전체 직원에게 알림 전송 시작 - 공지사항 ID: ${announcementId}`,
    );

    // 1. 공지사항 조회
    const announcement =
      await this.announcementContextService.공지사항을_조회한다(announcementId);

    // 2. 공지사항 대상 직원 목록 추출
    const targetEmployees = await this.공지사항_대상_직원_목록을_추출한다(
      announcement,
    );

    if (targetEmployees.length === 0) {
      this.logger.warn(`대상 직원이 없습니다 - 공지사항 ID: ${announcementId}`);
      return {
        success: true,
        sentCount: 0,
        failedCount: 0,
        message: '대상 직원이 없습니다.',
      };
    }

    // 3. 알림 전송
    const result = await this.알림을_전송한다({
      title: `공지사항: ${announcement.title}`,
      content: announcement.content,
      employeeNumbers: targetEmployees,
      linkUrl: `/announcements/${announcementId}`,
      metadata: {
        type: 'announcement',
        announcementId,
      },
    });

    this.logger.log(
      `공지사항 포함된 전체 직원에게 알림 전송 완료 - 성공: ${result.sentCount}명, 실패: ${result.failedCount}명`,
    );

    return result;
  }

  /**
   * 공지사항에_포함된_직원중_미답변자들에게_알림을보낸다
   */
  async 공지사항에_포함된_직원중_미답변자들에게_알림을보낸다(
    announcementId: string,
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    this.logger.log(
      `공지사항 포함된 직원 중 미답변자들에게 알림 전송 시작 - 공지사항 ID: ${announcementId}`,
    );

    // 1. 공지사항 조회
    const announcement =
      await this.announcementContextService.공지사항을_조회한다(announcementId);

    // 2. 공지사항에 연결된 설문 조회
    const survey = await this.surveyRepository.findOne({
      where: { announcementId },
    });

    if (!survey) {
      throw new BadRequestException(
        '설문이 없는 공지사항입니다. 설문이 있는 공지사항에만 미답변자 알림을 보낼 수 있습니다.',
      );
    }

    // 3. 공지사항 대상 직원 목록 추출
    const targetEmployees = await this.공지사항_대상_직원_목록을_추출한다(
      announcement,
    );

    if (targetEmployees.length === 0) {
      this.logger.warn(`대상 직원이 없습니다 - 공지사항 ID: ${announcementId}`);
      return {
        success: true,
        sentCount: 0,
        failedCount: 0,
        message: '대상 직원이 없습니다.',
      };
    }

    // 4. 미답변자 필터링 (SurveyCompletion에서 isCompleted=false 또는 레코드 없음)
    const completedEmployees = await this.surveyCompletionRepository.find({
      where: {
        surveyId: survey.id,
        isCompleted: true,
      },
    });

    const completedEmployeeIds = new Set(
      completedEmployees.map((c) => c.employeeId),
    );
    const unansweredEmployees = targetEmployees.filter(
      (empId) => !completedEmployeeIds.has(empId),
    );

    if (unansweredEmployees.length === 0) {
      this.logger.log(`미답변자가 없습니다 - 공지사항 ID: ${announcementId}`);
      return {
        success: true,
        sentCount: 0,
        failedCount: 0,
        message: '미답변자가 없습니다. 모든 직원이 응답을 완료했습니다.',
      };
    }

    // 5. 알림 전송
    const result = await this.알림을_전송한다({
      title: `설문 미답변 알림: ${announcement.title}`,
      content: `아직 응답하지 않으신 설문이 있습니다. 설문에 참여해주세요.`,
      employeeNumbers: unansweredEmployees,
      linkUrl: `/announcements/${announcementId}`,
      metadata: {
        type: 'announcement_survey_reminder',
        announcementId,
        surveyId: survey.id,
      },
    });

    this.logger.log(
      `공지사항 포함된 직원 중 미답변자들에게 알림 전송 완료 - 성공: ${result.sentCount}명, 실패: ${result.failedCount}명`,
    );

    return result;
  }

  /**
   * 공지사항에_포함된_미열람자들에게_알림을보낸다
   */
  async 공지사항에_포함된_미열람자들에게_알림을보낸다(
    announcementId: string,
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    this.logger.log(
      `공지사항 포함된 미열람자들에게 알림 전송 시작 - 공지사항 ID: ${announcementId}`,
    );

    // 1. 공지사항 조회
    const announcement =
      await this.announcementContextService.공지사항을_조회한다(announcementId);

    // 2. 공지사항 대상 직원 목록 추출
    const targetEmployees = await this.공지사항_대상_직원_목록을_추출한다(
      announcement,
    );

    if (targetEmployees.length === 0) {
      this.logger.warn(`대상 직원이 없습니다 - 공지사항 ID: ${announcementId}`);
      return {
        success: true,
        sentCount: 0,
        failedCount: 0,
        message: '대상 직원이 없습니다.',
      };
    }

    // 3. 미열람자 필터링 (AnnouncementRead에서 레코드 없음)
    const readEmployees = await this.announcementReadRepository.find({
      where: { announcementId },
    });

    const readEmployeeIds = new Set(readEmployees.map((r) => r.employeeId));
    const unreadEmployees = targetEmployees.filter(
      (empId) => !readEmployeeIds.has(empId),
    );

    if (unreadEmployees.length === 0) {
      this.logger.log(`미열람자가 없습니다 - 공지사항 ID: ${announcementId}`);
      return {
        success: true,
        sentCount: 0,
        failedCount: 0,
        message: '미열람자가 없습니다. 모든 직원이 열람했습니다.',
      };
    }

    // 4. 알림 전송
    const result = await this.알림을_전송한다({
      title: `미열람 공지사항: ${announcement.title}`,
      content: `아직 확인하지 않으신 공지사항이 있습니다.`,
      employeeNumbers: unreadEmployees,
      linkUrl: `/announcements/${announcementId}`,
      metadata: {
        type: 'announcement_unread_reminder',
        announcementId,
      },
    });

    this.logger.log(
      `공지사항 포함된 미열람자들에게 알림 전송 완료 - 성공: ${result.sentCount}명, 실패: ${result.failedCount}명`,
    );

    return result;
  }

  /**
   * 공지사항 대상 직원 목록을 추출한다
   * @private
   */
  private async 공지사항_대상_직원_목록을_추출한다(
    announcement: Announcement,
  ): Promise<string[]> {
    // 1. 전사공개인 경우 모든 직원 ID 반환
    if (announcement.isPublic) {
      const orgInfo = await this.companyContextService.조직_정보를_가져온다();
      return this.조직에서_모든_직원ID를_추출한다(orgInfo);
    }

    // 2. 제한공개인 경우 권한 필드 기반 필터링
    const employeeIds = new Set<string>();
    const orgInfo = await this.companyContextService.조직_정보를_가져온다();

    // 특정 직원 ID 목록
    if (announcement.permissionEmployeeIds && announcement.permissionEmployeeIds.length > 0) {
      announcement.permissionEmployeeIds.forEach((id) => employeeIds.add(id));
    }

    // 직급 코드로 필터링
    if (announcement.permissionRankCodes && announcement.permissionRankCodes.length > 0) {
      const employees = this.조직에서_직급별_직원ID를_추출한다(
        orgInfo,
        announcement.permissionRankCodes,
      );
      employees.forEach((id) => employeeIds.add(id));
    }

    // 직책 코드로 필터링
    if (announcement.permissionPositionCodes && announcement.permissionPositionCodes.length > 0) {
      const employees = this.조직에서_직책별_직원ID를_추출한다(
        orgInfo,
        announcement.permissionPositionCodes,
      );
      employees.forEach((id) => employeeIds.add(id));
    }

    // 부서 코드로 필터링
    if (announcement.permissionDepartmentCodes && announcement.permissionDepartmentCodes.length > 0) {
      const employees = this.조직에서_부서별_직원ID를_추출한다(
        orgInfo,
        announcement.permissionDepartmentCodes,
      );
      employees.forEach((id) => employeeIds.add(id));
    }

    return Array.from(employeeIds);
  }

  /**
   * 조직에서 모든 직원 ID를 추출한다
   * @private
   */
  private 조직에서_모든_직원ID를_추출한다(orgInfo: OrganizationInfo): string[] {
    const employeeIds: string[] = [];

    const extractFromDept = (dept: any) => {
      if (dept.employees) {
        dept.employees.forEach((emp: any) => {
          if (emp.employeeNumber) {
            employeeIds.push(emp.employeeNumber);
          }
        });
      }
      if (dept.children) {
        dept.children.forEach((child: any) => extractFromDept(child));
      }
    };

    if (orgInfo.departments) {
      orgInfo.departments.forEach((dept) => extractFromDept(dept));
    }

    return employeeIds;
  }

  /**
   * 조직에서 직급별 직원 ID를 추출한다
   * @private
   */
  private 조직에서_직급별_직원ID를_추출한다(
    orgInfo: OrganizationInfo,
    rankCodes: string[],
  ): string[] {
    const employeeIds: string[] = [];
    const rankCodeSet = new Set(rankCodes);

    const extractFromDept = (dept: any) => {
      if (dept.employees) {
        dept.employees.forEach((emp: any) => {
          if (emp.employeeNumber && emp.rankCode && rankCodeSet.has(emp.rankCode)) {
            employeeIds.push(emp.employeeNumber);
          }
        });
      }
      if (dept.children) {
        dept.children.forEach((child: any) => extractFromDept(child));
      }
    };

    if (orgInfo.departments) {
      orgInfo.departments.forEach((dept) => extractFromDept(dept));
    }

    return employeeIds;
  }

  /**
   * 조직에서 직책별 직원 ID를 추출한다
   * @private
   */
  private 조직에서_직책별_직원ID를_추출한다(
    orgInfo: OrganizationInfo,
    positionCodes: string[],
  ): string[] {
    const employeeIds: string[] = [];
    const positionCodeSet = new Set(positionCodes);

    const extractFromDept = (dept: any) => {
      if (dept.employees) {
        dept.employees.forEach((emp: any) => {
          if (
            emp.employeeNumber &&
            emp.positionCode &&
            positionCodeSet.has(emp.positionCode)
          ) {
            employeeIds.push(emp.employeeNumber);
          }
        });
      }
      if (dept.children) {
        dept.children.forEach((child: any) => extractFromDept(child));
      }
    };

    if (orgInfo.departments) {
      orgInfo.departments.forEach((dept) => extractFromDept(dept));
    }

    return employeeIds;
  }

  /**
   * 조직에서 부서별 직원 ID를 추출한다
   * @private
   */
  private 조직에서_부서별_직원ID를_추출한다(
    orgInfo: OrganizationInfo,
    departmentCodes: string[],
  ): string[] {
    const employeeIds: string[] = [];
    const departmentCodeSet = new Set(departmentCodes);

    const extractFromDept = (dept: any) => {
      const isDepartmentMatch =
        dept.departmentCode && departmentCodeSet.has(dept.departmentCode);

      if (isDepartmentMatch && dept.employees) {
        dept.employees.forEach((emp: any) => {
          if (emp.employeeNumber) {
            employeeIds.push(emp.employeeNumber);
          }
        });
      }

      if (dept.children) {
        dept.children.forEach((child: any) => extractFromDept(child));
      }
    };

    if (orgInfo.departments) {
      orgInfo.departments.forEach((dept) => extractFromDept(dept));
    }

    return employeeIds;
  }

  /**
   * 알림을 전송한다 (SSO + Notification 서버)
   * @private
   */
  private async 알림을_전송한다(params: {
    title: string;
    content: string;
    employeeNumbers: string[];
    linkUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    const { title, content, employeeNumbers, linkUrl, metadata } = params;

    try {
      // 1. SSO에서 FCM 토큰 조회
      this.logger.debug(
        `FCM 토큰 조회 중: ${employeeNumbers.length}명의 직원`,
      );

      const fcmResponse = await axios.post(
        `${this.ssoBaseUrl}/api/v1/fcm-tokens/bulk`,
        { employeeNumbers },
      );

      const fcmData = fcmResponse.data;

      if (!fcmData.byEmployee || fcmData.byEmployee.length === 0) {
        this.logger.warn('FCM 토큰이 있는 수신자가 없습니다.');
        return {
          success: false,
          sentCount: 0,
          failedCount: employeeNumbers.length,
          message: 'FCM 토큰이 있는 수신자가 없습니다.',
        };
      }

      // 2. deviceType에 'portal'이 포함된 FCM 토큰만 필터링
      const recipients = fcmData.byEmployee
        .map((emp: any) => ({
          employeeNumber: emp.employeeNumber,
          tokens: emp.tokens
            .filter((token: any) =>
              token.deviceType.toLowerCase().includes('portal'),
            )
            .map((t: any) => t.fcmToken),
        }))
        .filter((emp: any) => emp.tokens.length > 0);

      if (recipients.length === 0) {
        this.logger.warn('Portal FCM 토큰이 있는 수신자가 없습니다.');
        return {
          success: false,
          sentCount: 0,
          failedCount: employeeNumbers.length,
          message: 'Portal FCM 토큰이 있는 수신자가 없습니다.',
        };
      }

      this.logger.debug(
        `Portal FCM 토큰 조회 완료: ${recipients.length}명의 수신자`,
      );

      // 3. 알림 서버로 전송
      const notificationResponse = await axios.post(
        `${this.notificationBaseUrl}/api/v1/notifications/send`,
        {
          sender: 'system',
          title,
          content,
          recipients,
          sourceSystem: 'cms',
          linkUrl,
          metadata,
        },
      );

      const notificationResult = notificationResponse.data;

      this.logger.log(
        `알림 전송 성공: ${notificationResult.successCount || recipients.length}명`,
      );

      return {
        success: true,
        sentCount: notificationResult.successCount || recipients.length,
        failedCount: notificationResult.failureCount || 0,
        message: '알림 전송 완료',
      };
    } catch (error) {
      this.logger.error(`알림 전송 중 오류 발생: ${error.message}`, error.stack);

      return {
        success: false,
        sentCount: 0,
        failedCount: employeeNumbers.length,
        message: `알림 전송 실패: ${error.message}`,
      };
    }
  }
}
