import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Employee } from './employee.entity';
import { EmployeeDto } from './employee.types';
import { Department } from '@domain/common/department/department.entity';

/**
 * 직원 테스트용 서비스
 *
 * 테스트 시 사용할 목데이터를 생성하고 관리하는 서비스입니다.
 * 실제 운영 환경에서는 사용하지 않습니다.
 */
@Injectable()
export class EmployeeTestService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  /**
   * 직원 데이터를 확인하고 필요시 생성한다
   * @param minCount 최소 필요한 직원 수
   * @returns 직원 목록
   */
  async 직원_데이터를_확인하고_생성한다(
    minCount: number = 5,
  ): Promise<EmployeeDto[]> {
    // 기존 직원 데이터 조회
    const existingEmployees = await this.employeeRepository.find({
      where: { deletedAt: IsNull() },
      take: minCount,
    });

    if (existingEmployees.length >= minCount) {
      console.log(
        `기존 직원 데이터 사용: ${existingEmployees.length}명 (최소 필요: ${minCount}명)`,
      );
      return existingEmployees.map((emp) => emp.DTO로_변환한다());
    }

    // 부족한 경우 추가 생성
    const neededCount = minCount - existingEmployees.length;
    console.log(`직원 데이터 부족: ${neededCount}명 추가 생성 필요`);

    // 부서 데이터 조회 (첫 번째 부서 사용)
    const departments = await this.departmentRepository.find({
      where: { deletedAt: IsNull() },
      take: 1,
    });

    const departmentId = departments.length > 0 ? departments[0].id : undefined;

    // 추가 직원 생성
    const newEmployees: Employee[] = [];
    const timestamp = Date.now().toString().slice(-6);

    for (let i = 0; i < neededCount; i++) {
      const employee = new Employee();
      employee.employeeNumber = `TEST${timestamp}${String(i + 1).padStart(3, '0')}`;
      employee.name = `테스트 직원 ${i + 1}`;
      employee.email = `test${i + 1}@test.com`;
      employee.phoneNumber = `010-${String(i + 1).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`;
      employee.dateOfBirth = new Date(1990, 0, 1);
      employee.gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
      employee.hireDate = new Date(2020, 0, 1);
      employee.status = '재직중';
      employee.isExcludedFromList = false;
      employee.departmentId = departmentId;
      employee.externalId = `test-emp-${timestamp}-${i + 1}`;
      employee.externalCreatedAt = new Date();
      employee.externalUpdatedAt = new Date();
      employee.createdBy = 'TEST_SYSTEM';
      employee.updatedBy = 'TEST_SYSTEM';

      newEmployees.push(employee);
    }

    const savedEmployees = await this.employeeRepository.save(newEmployees);

    console.log(`직원 생성 완료: ${savedEmployees.length}명`);

    // 기존 + 새로 생성된 직원 반환
    const allEmployees = [...existingEmployees, ...savedEmployees];
    return allEmployees.map((emp) => emp.DTO로_변환한다());
  }

  /**
   * 테스트용 직원 목데이터를 생성한다
   * @returns 생성된 직원 목록
   */
  async 테스트용_목데이터를_생성한다(): Promise<EmployeeDto[]> {
    // 기존 테스트 데이터 정리
    await this.테스트_데이터를_정리한다();

    // 부서 데이터 조회 (첫 번째 부서 사용)
    const departments = await this.departmentRepository.find({
      where: { deletedAt: IsNull() },
      take: 1,
    });

    const departmentId = departments.length > 0 ? departments[0].id : undefined;

    const testEmployees = [
      {
        employeeNumber: 'TEST001',
        name: '테스트 직원 1',
        email: 'test1@test.com',
        phoneNumber: '010-0001-0001',
        dateOfBirth: new Date(1990, 0, 1),
        gender: 'MALE' as const,
        hireDate: new Date(2020, 0, 1),
        status: '재직중' as const,
        isExcludedFromList: false,
        departmentId,
        externalId: 'test-emp-001',
      },
      {
        employeeNumber: 'TEST002',
        name: '테스트 직원 2',
        email: 'test2@test.com',
        phoneNumber: '010-0002-0002',
        dateOfBirth: new Date(1991, 0, 1),
        gender: 'FEMALE' as const,
        hireDate: new Date(2020, 1, 1),
        status: '재직중' as const,
        isExcludedFromList: false,
        departmentId,
        externalId: 'test-emp-002',
      },
      {
        employeeNumber: 'TEST003',
        name: '테스트 직원 3',
        email: 'test3@test.com',
        phoneNumber: '010-0003-0003',
        dateOfBirth: new Date(1992, 0, 1),
        gender: 'MALE' as const,
        hireDate: new Date(2020, 2, 1),
        status: '재직중' as const,
        isExcludedFromList: false,
        departmentId,
        externalId: 'test-emp-003',
      },
    ];

    const employees = testEmployees.map((emp) => {
      const employee = new Employee();
      Object.assign(employee, emp);
      employee.externalCreatedAt = new Date();
      employee.externalUpdatedAt = new Date();
      employee.createdBy = 'TEST_SYSTEM';
      employee.updatedBy = 'TEST_SYSTEM';
      return employee;
    });

    const savedEmployees = await this.employeeRepository.save(employees);
    return savedEmployees.map((emp) => emp.DTO로_변환한다());
  }

  /**
   * 현재 직원 수를 조회한다
   * @returns 직원 수
   */
  async 현재_직원_수를_조회한다(): Promise<number> {
    const count = await this.employeeRepository.count({
      where: { deletedAt: IsNull() },
    });
    return count;
  }

  /**
   * 부서별 직원 테스트데이터를 생성한다
   * @param departmentId 부서 ID
   * @param count 생성할 직원 수
   * @returns 생성된 직원 목록
   */
  async 부서별_직원_테스트데이터를_생성한다(
    departmentId: string,
    count: number = 5,
  ): Promise<EmployeeDto[]> {
    const employees: Employee[] = [];
    const timestamp = Date.now().toString().slice(-6);

    for (let i = 0; i < count; i++) {
      const employee = new Employee();
      employee.employeeNumber = `DEPT${timestamp}${String(i + 1).padStart(3, '0')}`;
      employee.name = `부서 직원 ${i + 1}`;
      employee.email = `dept${i + 1}@test.com`;
      employee.phoneNumber = `010-${String(i + 1).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`;
      employee.dateOfBirth = new Date(1990 + i, 0, 1);
      employee.gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
      employee.hireDate = new Date(2020, 0, 1);
      employee.status = '재직중';
      employee.isExcludedFromList = false;
      employee.departmentId = departmentId;
      employee.externalId = `test-dept-emp-${timestamp}-${i + 1}`;
      employee.externalCreatedAt = new Date();
      employee.externalUpdatedAt = new Date();
      employee.createdBy = 'TEST_SYSTEM';
      employee.updatedBy = 'TEST_SYSTEM';

      employees.push(employee);
    }

    const savedEmployees = await this.employeeRepository.save(employees);
    return savedEmployees.map((emp) => emp.DTO로_변환한다());
  }

  /**
   * 매니저 하위직원 테스트데이터를 생성한다
   * @param managerCount 매니저 수 (또는 매니저 ID)
   * @param employeesPerManager 매니저당 직원 수
   * @returns 생성된 직원 목록
   */
  async 매니저_하위직원_테스트데이터를_생성한다(
    managerCount: string | number,
    employeesPerManager: number = 5,
  ): Promise<EmployeeDto[]> {
    // managerCount가 숫자인 경우 (레거시 호환성)
    if (typeof managerCount === 'number') {
      // 기존 직원 중 매니저 역할을 할 수 있는 직원 조회
      const managers = await this.employeeRepository.find({
        where: { deletedAt: IsNull() },
        take: managerCount,
      });

      if (managers.length === 0) {
        throw new Error('매니저로 사용할 직원이 없습니다.');
      }

      const allEmployees: Employee[] = [];
      for (const manager of managers) {
        const subordinates = await this.매니저_하위직원_테스트데이터를_생성한다(
          manager.id,
          employeesPerManager,
        );
        allEmployees.push(...subordinates.map((e) => e as any));
      }

      return allEmployees.map((emp) => emp.DTO로_변환한다());
    }

    // managerId가 문자열인 경우 (단일 매니저)
    const managerId = managerCount;
    const count = employeesPerManager;
    
    // 매니저 정보 조회
    const manager = await this.employeeRepository.findOne({
      where: { id: managerId, deletedAt: IsNull() },
    });

    if (!manager) {
      throw new Error(`매니저를 찾을 수 없습니다: ${managerId}`);
    }

    const employees: Employee[] = [];
    const timestamp = Date.now().toString().slice(-6);

    for (let i = 0; i < count; i++) {
      const employee = new Employee();
      employee.employeeNumber = `MGR${timestamp}${String(i + 1).padStart(3, '0')}`;
      employee.name = `하위 직원 ${i + 1}`;
      employee.email = `sub${i + 1}@test.com`;
      employee.phoneNumber = `010-${String(i + 1).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`;
      employee.dateOfBirth = new Date(1990 + i, 0, 1);
      employee.gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
      employee.hireDate = new Date(2020, 0, 1);
      employee.status = '재직중';
      employee.isExcludedFromList = false;
      employee.departmentId = manager.departmentId;
      employee.managerId = managerId;
      employee.externalId = `test-mgr-sub-${timestamp}-${i + 1}`;
      employee.externalCreatedAt = new Date();
      employee.externalUpdatedAt = new Date();
      employee.createdBy = 'TEST_SYSTEM';
      employee.updatedBy = 'TEST_SYSTEM';

      employees.push(employee);
    }

    const savedEmployees = await this.employeeRepository.save(employees);
    return savedEmployees.map((emp) => emp.DTO로_변환한다());
  }

  /**
   * 특정 직원 테스트데이터를 생성한다
   * @param employeeData 직원 데이터
   * @returns 생성된 직원 정보
   */
  async 특정_직원_테스트데이터를_생성한다(employeeData: {
    employeeNumber?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    gender?: 'MALE' | 'FEMALE';
    hireDate?: Date;
    status?: '재직중' | '휴직중' | '퇴사';
    isExcludedFromList?: boolean;
    departmentId?: string;
    managerId?: string;
    externalId?: string;
  }): Promise<EmployeeDto> {
    const employee = new Employee();
    Object.assign(employee, {
      employeeNumber: employeeData.employeeNumber || 'TEST001',
      name: employeeData.name || '테스트 직원',
      email: employeeData.email || 'test@test.com',
      phoneNumber: employeeData.phoneNumber || '010-0000-0000',
      dateOfBirth: employeeData.dateOfBirth || new Date(1990, 0, 1),
      gender: employeeData.gender || 'MALE',
      hireDate: employeeData.hireDate || new Date(2020, 0, 1),
      status: employeeData.status || '재직중',
      isExcludedFromList: employeeData.isExcludedFromList || false,
      departmentId: employeeData.departmentId,
      managerId: employeeData.managerId,
      externalId: employeeData.externalId || `test-emp-${Date.now()}`,
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: 'TEST_SYSTEM',
      updatedBy: 'TEST_SYSTEM',
    });

    const savedEmployee = await this.employeeRepository.save(employee);
    return savedEmployee.DTO로_변환한다();
  }

  /**
   * 랜덤 테스트데이터를 생성한다
   * @param count 생성할 직원 수
   * @returns 생성된 직원 목록
   */
  async 랜덤_테스트데이터를_생성한다(
    count: number = 10,
  ): Promise<EmployeeDto[]> {
    const departments = await this.departmentRepository.find({
      where: { deletedAt: IsNull() },
    });

    const employees: Employee[] = [];
    const timestamp = Date.now().toString().slice(-6);

    for (let i = 0; i < count; i++) {
      const employee = new Employee();
      employee.employeeNumber = `RAND${timestamp}${String(i + 1).padStart(3, '0')}`;
      employee.name = `랜덤 직원 ${i + 1}`;
      employee.email = `random${i + 1}@test.com`;
      employee.phoneNumber = `010-${String(i + 1).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`;
      employee.dateOfBirth = new Date(1990 + (i % 20), i % 12, (i % 28) + 1);
      employee.gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
      employee.hireDate = new Date(2020 + (i % 3), i % 12, (i % 28) + 1);
      employee.status = ['재직중', '휴직중', '퇴사'][i % 3] as any;
      employee.isExcludedFromList = i % 10 === 0;
      employee.departmentId =
        departments.length > 0
          ? departments[i % departments.length].id
          : undefined;
      employee.externalId = `test-random-${timestamp}-${i + 1}`;
      employee.externalCreatedAt = new Date();
      employee.externalUpdatedAt = new Date();
      employee.createdBy = 'TEST_SYSTEM';
      employee.updatedBy = 'TEST_SYSTEM';

      employees.push(employee);
    }

    const savedEmployees = await this.employeeRepository.save(employees);
    return savedEmployees.map((emp) => emp.DTO로_변환한다());
  }

  /**
   * 테스트 데이터를 정리한다
   * @returns 삭제된 직원 수
   */
  async 테스트_데이터를_정리한다(): Promise<number> {
    // E2E 테스트는 독립적으로 실행되므로 모든 직원 데이터를 삭제
    return await this.모든_테스트데이터를_삭제한다();
  }

  /**
   * 모든 테스트 데이터를 삭제한다
   * @returns 삭제된 직원 수
   */
  async 모든_테스트데이터를_삭제한다(): Promise<number> {
    const result = await this.employeeRepository
      .createQueryBuilder()
      .delete()
      .execute();

    return result.affected || 0;
  }
}

