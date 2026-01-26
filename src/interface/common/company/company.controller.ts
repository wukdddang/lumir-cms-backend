import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AnnouncementBusinessService } from '@business/announcement-business/announcement-business.service';
import {
  OrganizationInfoResponseDto,
  DepartmentListResponseDto,
  RankListResponseDto,
  PositionListResponseDto,
  EmployeeDetailResponseDto,
  EmployeeListResponseDto,
} from '@interface/common/dto/company/company-response.dto';

@ApiTags('공통. 관리자 - 회사 관련')
@ApiBearerAuth('Bearer')
@Controller('admin/company')
export class CompanyController {
  constructor(
    private readonly announcementBusinessService: AnnouncementBusinessService,
  ) {}

  /**
   * 조직 정보를 가져온다 (SSO)
   */
  @Get('organizations')
  @ApiOperation({
    summary: '조직 정보 조회',
    description: 'SSO 서버로부터 전체 조직 구조를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '조직 정보 조회 성공',
    type: OrganizationInfoResponseDto,
  })
  async 조직_정보를_가져온다(): Promise<OrganizationInfoResponseDto> {
    return await this.announcementBusinessService.조직_정보를_가져온다();
  }

  /**
   * 부서 정보를 가져온다 (SSO)
   */
  @Get('organizations/departments')
  @ApiOperation({
    summary: '부서 정보 조회',
    description: 'SSO 서버로부터 부서 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '부서 정보 조회 성공',
    type: DepartmentListResponseDto,
  })
  async 부서_정보를_가져온다(): Promise<DepartmentListResponseDto> {
    return await this.announcementBusinessService.부서_정보를_가져온다();
  }

  /**
   * 직급 정보를 가져온다 (SSO)
   */
  @Get('organizations/ranks')
  @ApiOperation({
    summary: '직급 정보 조회',
    description: 'SSO 서버로부터 직급 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '직급 정보 조회 성공',
    type: RankListResponseDto,
  })
  async 직급_정보를_가져온다(): Promise<RankListResponseDto> {
    const ranks = await this.announcementBusinessService.직급_정보를_가져온다();
    return {
      items: ranks,
      total: ranks.length,
    };
  }

  /**
   * 직책 정보를 가져온다 (SSO)
   */
  @Get('organizations/positions')
  @ApiOperation({
    summary: '직책 정보 조회',
    description: 'SSO 서버로부터 직책 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '직책 정보 조회 성공',
    type: PositionListResponseDto,
  })
  async 직책_정보를_가져온다(): Promise<PositionListResponseDto> {
    const positions =
      await this.announcementBusinessService.직책_정보를_가져온다();
    return {
      items: positions,
      total: positions.length,
    };
  }

  /**
   * 직원 정보를 조회한다 (단건)
   */
  @Get('organizations/employees/:employeeNumber')
  @ApiOperation({
    summary: '직원 정보 조회',
    description: 'SSO 서버로부터 특정 직원의 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'employeeNumber',
    description: '사번',
    example: '23047',
  })
  @ApiResponse({
    status: 200,
    description: '직원 정보 조회 성공',
    type: EmployeeDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '직원을 찾을 수 없음',
  })
  async 직원_정보를_조회한다(
    @Param('employeeNumber') employeeNumber: string,
  ): Promise<EmployeeDetailResponseDto> {
    const employee =
      await this.announcementBusinessService.직원_정보를_조회한다(employeeNumber);

    if (!employee) {
      throw new BadRequestException('직원을 찾을 수 없습니다.');
    }

    return this.직원_데이터를_DTO로_변환한다(employee);
  }

  /**
   * 직원 목록을 조회한다 (복수)
   */
  @Get('organizations/employees')
  @ApiOperation({
    summary: '직원 목록 조회',
    description:
      'SSO 서버로부터 여러 직원의 정보를 조회합니다. 쿼리 파라미터로 employeeNumbers를 콤마로 구분하여 전달합니다.',
  })
  @ApiQuery({
    name: 'employeeNumbers',
    description: '사번 목록 (콤마로 구분)',
    example: '23047,24019,24024',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '직원 목록 조회 성공',
    type: EmployeeListResponseDto,
  })
  async 직원_목록을_조회한다(
    @Query('employeeNumbers') employeeNumbers: string,
  ): Promise<EmployeeListResponseDto> {
    if (!employeeNumbers) {
      throw new BadRequestException('employeeNumbers 파라미터가 필요합니다.');
    }

    const numbersArray = employeeNumbers.split(',').map((num) => num.trim());

    if (numbersArray.length === 0) {
      throw new BadRequestException('최소 1개 이상의 사번이 필요합니다.');
    }

    const employees =
      await this.announcementBusinessService.직원_목록을_조회한다(numbersArray);

    const items = employees.map((employee) =>
      this.직원_데이터를_DTO로_변환한다(employee),
    );

    return {
      items,
      total: items.length,
    };
  }

  /**
   * 직원 데이터를 DTO로 변환한다
   * @private
   */
  private 직원_데이터를_DTO로_변환한다(employee: any): EmployeeDetailResponseDto {
    return {
      id: employee.id,
      number: employee.employeeNumber || employee.number,
      name: employee.name,
      email: employee.email,
      phone: employee.phoneNumber || employee.phone,
      dateOfBirth: employee.dateOfBirth,
      gender: employee.gender,
      status: employee.status,
      hireDate: employee.hireDate,
      // department 객체에서 정보 추출
      departmentId: employee.department?.id || employee.departmentId,
      departmentName: employee.department?.departmentName || employee.departmentName,
      departmentCode: employee.department?.departmentCode || employee.departmentCode,
      // rank 객체에서 정보 추출
      rankId: employee.rank?.id || employee.rankId,
      rankName: employee.rank?.rankName || employee.rankName,
      // position 객체에서 정보 추출
      positionId: employee.position?.id || employee.positionId,
      positionName: employee.position?.positionTitle || employee.positionTitle || employee.positionName,
      hasManagementAuthority: employee.position?.hasManagementAuthority || employee.hasManagementAuthority,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      isActive: employee.isActive !== undefined ? employee.isActive : true,
    };
  }
}
