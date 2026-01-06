import { Controller, Param, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  SendNotificationDto,
  NotificationResponseDto,
  EmployeeBasicResponseDto,
  DepartmentBasicResponseDto,
  PositionResponseDto,
  RankResponseDto,
  OrganizationHierarchyResponseDto,
  GetOrganizationHierarchyDto,
} from './dto/common.dto';
import {
  GetAllEmployees,
  GetEmployee,
  GetAllDepartments,
  GetDepartment,
  GetAllPositions,
  GetPosition,
  GetAllRanks,
  GetRank,
  GetOrganizationHierarchy,
  SendNotification,
} from './decorators/common.decorators';
import {
  EmployeeService,
  DepartmentService,
  PositionService,
  RankService,
  OrganizationService,
  NotificationService,
} from '@business/common';

/**
 * CMS 공통 기능 컨트롤러
 *
 * 직원, 부서, 직책, 직급, 조직 하이라키, 알림 관련 API를 제공합니다.
 */
@ApiTags('CMS 공통')
@Controller('cms/common')
export class CmsCommonController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly departmentService: DepartmentService,
    private readonly positionService: PositionService,
    private readonly rankService: RankService,
    private readonly organizationService: OrganizationService,
    private readonly notificationService: NotificationService,
  ) {}

  // ========== GET 엔드포인트 ==========

  /**
   * 전체 직원 목록을 조회한다
   */
  @GetAllEmployees()
  async getAllEmployees(): Promise<EmployeeBasicResponseDto[]> {
    const result = await this.employeeService.직원_목록을_조회_한다();
    return result.data as any;
  }

  /**
   * 특정 직원을 조회한다
   */
  @GetEmployee()
  async getEmployee(
    @Param('id') id: string,
  ): Promise<EmployeeBasicResponseDto> {
    const result = await this.employeeService.직원을_조회_한다(id);
    return result.data as any;
  }

  /**
   * 전체 부서 목록을 조회한다
   */
  @GetAllDepartments()
  async getAllDepartments(): Promise<DepartmentBasicResponseDto[]> {
    const result = await this.departmentService.부서_목록을_조회_한다();
    return result.data as any;
  }

  /**
   * 특정 부서를 조회한다
   */
  @GetDepartment()
  async getDepartment(
    @Param('id') id: string,
  ): Promise<DepartmentBasicResponseDto> {
    const result = await this.departmentService.부서를_조회_한다(id);
    return result.data as any;
  }

  /**
   * 전체 직책 목록을 조회한다
   */
  @GetAllPositions()
  async getAllPositions(): Promise<PositionResponseDto[]> {
    const result = await this.positionService.직책_목록을_조회_한다();
    return result.data as any;
  }

  /**
   * 특정 직책을 조회한다
   */
  @GetPosition()
  async getPosition(@Param('id') id: string): Promise<PositionResponseDto> {
    const result = await this.positionService.직책을_조회_한다(id);
    return result.data as any;
  }

  /**
   * 전체 직급 목록을 조회한다
   */
  @GetAllRanks()
  async getAllRanks(): Promise<RankResponseDto[]> {
    const result = await this.rankService.직급_목록을_조회_한다();
    return result.data as any;
  }

  /**
   * 특정 직급을 조회한다
   */
  @GetRank()
  async getRank(@Param('id') id: string): Promise<RankResponseDto> {
    const result = await this.rankService.직급을_조회_한다(id);
    return result.data as any;
  }

  /**
   * 조직 하이라키를 조회한다
   */
  @GetOrganizationHierarchy()
  async getOrganizationHierarchy(
    @Query() query: GetOrganizationHierarchyDto,
  ): Promise<OrganizationHierarchyResponseDto> {
    const result =
      await this.organizationService.조직_하이라키를_조회_한다(query);
    return result.data as any;
  }

  // ========== POST 엔드포인트 ==========

  /**
   * 알림을 전송한다
   */
  @SendNotification()
  async sendNotification(
    @Param('entityId') entityId: string,
    @Body() dto: SendNotificationDto,
  ): Promise<NotificationResponseDto> {
    const result = await this.notificationService.알림을_전송_한다(
      entityId,
      dto as any,
    );
    return result.data;
  }
}
