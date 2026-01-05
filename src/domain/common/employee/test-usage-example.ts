/**
 * EmployeeTestService 사용 예시
 *
 * 이 파일은 EmployeeTestService의 사용법을 보여주는 예시입니다.
 * 실제 테스트에서 참고하여 사용하세요.
 */

import { EmployeeTestService } from './employee-test.service';

/**
 * 테스트 서비스 사용 예시 클래스
 */
export class EmployeeTestUsageExample {
  constructor(private readonly employeeTestService: EmployeeTestService) {}

  /**
   * 기본 테스트 데이터 생성 예시
   */
  async 기본_테스트데이터_생성_예시() {
    // 1. 기본 목데이터 생성 (계층구조 포함)
    const employees =
      await this.employeeTestService.테스트용_목데이터를_생성한다();
    console.log('생성된 직원 수:', employees.length);
    console.log(
      '재직중인 직원들:',
      employees.filter((e) => e.isActive),
    );

    // 2. 특정 직원 생성
    const customEmployee =
      await this.employeeTestService.특정_직원_테스트데이터를_생성한다({
        employeeNumber: 'CUSTOM001',
        name: '커스텀직원',
        email: 'custom@company.com',
        externalId: 'custom-emp-001',
        phoneNumber: '010-9999-9999',
        status: '재직중',
        departmentId: 'custom-dept',
      });
    console.log('커스텀 직원 생성:', customEmployee);

    // 3. 랜덤 테스트 데이터 생성
    const randomEmployees =
      await this.employeeTestService.랜덤_테스트데이터를_생성한다(5);
    console.log('랜덤 직원 생성:', randomEmployees.length);

    // 4. 부서별 직원 데이터 생성
    const departmentEmployees =
      await this.employeeTestService.부서별_직원_테스트데이터를_생성한다(
        'test-dept-001',
        3,
      );
    console.log('부서별 직원 생성:', departmentEmployees.length);

    // 5. 매니저-하위직원 관계 데이터 생성
    const managerEmployeeData =
      await this.employeeTestService.매니저_하위직원_테스트데이터를_생성한다(
        2,
        3,
      );
    console.log('매니저-하위직원 관계 생성:', managerEmployeeData.length);

    return {
      basic: employees,
      custom: customEmployee,
      random: randomEmployees,
      department: departmentEmployees,
      managerEmployee: managerEmployeeData,
    };
  }

  /**
   * 테스트 데이터 정리 예시
   */
  async 테스트데이터_정리_예시() {
    // 1. 테스트 데이터만 정리
    const deletedCount =
      await this.employeeTestService.테스트_데이터를_정리한다();
    console.log('삭제된 테스트 데이터 수:', deletedCount);

    // 2. 모든 데이터 삭제 (주의: 운영 환경에서 사용 금지)
    // const allDeletedCount = await this.employeeTestService.모든_테스트데이터를_삭제한다();
    // console.log('삭제된 모든 데이터 수:', allDeletedCount);
  }

  /**
   * 전체 테스트 시나리오 예시
   */
  async 전체_테스트_시나리오() {
    try {
      console.log('=== 테스트 데이터 생성 시작 ===');

      // 1. 기본 테스트 데이터 생성
      const testData = await this.기본_테스트데이터_생성_예시();

      console.log('=== 테스트 완료 ===');
      console.log('생성된 직원 수:', testData.basic.length);
      console.log(
        '재직중인 직원 수:',
        testData.basic.filter((e) => e.isActive).length,
      );

      return {
        testData,
      };
    } catch (error) {
      console.error('테스트 실행 중 오류:', error);
      throw error;
    } finally {
      // 2. 테스트 데이터 정리
      console.log('=== 테스트 데이터 정리 ===');
      await this.테스트데이터_정리_예시();
    }
  }
}

/**
 * E2E 테스트에서 사용할 수 있는 헬퍼 함수들
 */
export class EmployeeTestHelpers {
  constructor(private readonly employeeTestService: EmployeeTestService) {}

  /**
   * E2E 테스트용 기본 데이터 설정
   */
  async E2E_테스트용_데이터_설정() {
    return await this.employeeTestService.테스트용_목데이터를_생성한다();
  }

  /**
   * E2E 테스트용 데이터 정리
   */
  async E2E_테스트용_데이터_정리() {
    return await this.employeeTestService.테스트_데이터를_정리한다();
  }

  /**
   * 특정 테스트 케이스용 데이터 생성
   */
  async 특정_테스트케이스용_데이터_생성(testCase: string) {
    switch (testCase) {
      case 'department':
        return await this.employeeTestService.부서별_직원_테스트데이터를_생성한다(
          'test-dept',
          10,
        );
      case 'manager':
        return await this.employeeTestService.매니저_하위직원_테스트데이터를_생성한다(
          3,
          5,
        );
      case 'random':
        return await this.employeeTestService.랜덤_테스트데이터를_생성한다(20);
      case 'basic':
      default:
        return await this.employeeTestService.테스트용_목데이터를_생성한다();
    }
  }
}
