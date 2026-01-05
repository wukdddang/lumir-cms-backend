import { Employee } from '@domain/common/employee/employee.entity';

/**
 * 테스트용 직원 픽스처
 */
export class EmployeeFixture {
  /**
   * 기본 직원을 생성한다
   */
  static 기본_직원을_생성한다(): Employee {
    const employee = new Employee(
      'EMP001',
      '홍길동',
      'hong@example.com',
      'external-001',
    );
    employee.id = '550e8400-e29b-41d4-a716-446655440001';
    employee.createdAt = new Date();
    employee.updatedAt = new Date();
    employee.version = 1;
    return employee;
  }

  /**
   * 관리자 직원을 생성한다
   */
  static 관리자_직원을_생성한다(): Employee {
    const employee = new Employee(
      'EMP002',
      '관리자',
      'admin@example.com',
      'external-002',
    );
    employee.id = '550e8400-e29b-41d4-a716-446655440002';
    employee.createdAt = new Date();
    employee.updatedAt = new Date();
    employee.version = 1;
    return employee;
  }

  /**
   * 커스텀 직원을 생성한다
   */
  static 커스텀_직원을_생성한다(partial: Partial<Employee>): Employee {
    const employee = this.기본_직원을_생성한다();
    Object.assign(employee, partial);
    return employee;
  }
}
