import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Department } from './department.entity';
import { DepartmentDto } from './department.types';

/**
 * 부서 테스트용 서비스
 *
 * 테스트 시 사용할 목데이터를 생성하고 관리하는 서비스입니다.
 * 실제 운영 환경에서는 사용하지 않습니다.
 */
@Injectable()
export class DepartmentTestService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  /**
   * 테스트용 부서 목데이터를 생성한다
   * @returns 생성된 부서 목록
   */
  async 테스트용_목데이터를_생성한다(): Promise<DepartmentDto[]> {
    // 기존 테스트 데이터 정리
    await this.테스트_데이터를_정리한다();

    const testDepartments = [
      {
        name: '루미르 주식회사',
        code: '루미르',
        order: 0,
        externalId: 'test-dept-001',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
      },
      {
        name: '개발본부',
        code: '개발본부',
        order: 1,
        parentDepartmentId: 'test-dept-001',
        externalId: 'test-dept-002',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
      },
      {
        name: '개발팀',
        code: '개발팀',
        order: 2,
        parentDepartmentId: 'test-dept-002',
        externalId: 'test-dept-003',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
      },
    ];

    // 부서 엔티티 생성 및 저장
    const departments = testDepartments.map((dept) => {
      const department = new Department(
        dept.name,
        dept.code,
        dept.externalId,
        dept.order,
        undefined, // managerId
        dept.parentDepartmentId,
        dept.externalCreatedAt,
        dept.externalUpdatedAt,
      );
      department.createdBy = 'TEST_SYSTEM';
      department.updatedBy = 'TEST_SYSTEM';
      return department;
    });

    const savedDepartments = await this.departmentRepository.save(departments);

    console.log(`부서 생성 완료: ${savedDepartments.length}개`);

    return savedDepartments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 테스트 데이터를 정리한다
   * @returns 삭제된 부서 수
   */
  async 테스트_데이터를_정리한다(): Promise<number> {
    // E2E 테스트는 독립적으로 실행되므로 모든 부서 데이터를 삭제
    return await this.모든_테스트데이터를_삭제한다();
  }

  /**
   * 모든 테스트 데이터를 삭제한다
   * @returns 삭제된 부서 수
   */
  async 모든_테스트데이터를_삭제한다(): Promise<number> {
    const result = await this.departmentRepository
      .createQueryBuilder()
      .delete()
      .execute();

    return result.affected || 0;
  }
}

