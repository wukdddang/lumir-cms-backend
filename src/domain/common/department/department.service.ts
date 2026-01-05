import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Department } from './department.entity';
import {
  DepartmentDto,
  DepartmentFilter,
  DepartmentListOptions,
  DepartmentStatistics,
} from './department.types';

/**
 * 부서 도메인 서비스
 *
 * 부서 엔티티의 비즈니스 로직과 데이터베이스 접근을 담당하는 서비스입니다.
 * TypeORM Repository를 직접 사용하여 데이터베이스 작업을 수행합니다.
 */
@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  /**
   * ID로 부서를 조회한다
   * @param id 부서 ID
   * @returns 부서 정보 (없으면 null)
   */
  async ID로_조회한다(id: string): Promise<DepartmentDto | null> {
    const department = await this.departmentRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    return department ? department.DTO로_변환한다() : null;
  }

  /**
   * 부서 코드로 부서를 조회한다
   * @param code 부서 코드
   * @returns 부서 정보 (없으면 null)
   */
  async 부서코드로_조회한다(code: string): Promise<DepartmentDto | null> {
    const department = await this.departmentRepository.findOne({
      where: { code, deletedAt: IsNull() },
    });

    return department ? department.DTO로_변환한다() : null;
  }

  /**
   * 외부 ID로 부서를 조회한다
   * @param externalId 외부 시스템 ID
   * @returns 부서 정보 (없으면 null)
   */
  async 외부ID로_조회한다(externalId: string): Promise<DepartmentDto | null> {
    const department = await this.departmentRepository.findOne({
      where: { externalId, deletedAt: IsNull() },
    });

    return department ? department.DTO로_변환한다() : null;
  }

  /**
   * 부서명으로 부서를 조회한다
   * @param name 부서명
   * @returns 부서 정보 (없으면 null)
   */
  async 부서명으로_조회한다(name: string): Promise<DepartmentDto | null> {
    const department = await this.departmentRepository.findOne({
      where: { name, deletedAt: IsNull() },
    });

    return department ? department.DTO로_변환한다() : null;
  }

  /**
   * 필터 조건으로 부서 목록을 조회한다
   * @param filter 필터 조건
   * @returns 부서 목록
   */
  async 필터_조회한다(filter: DepartmentFilter): Promise<DepartmentDto[]> {
    const queryBuilder =
      this.departmentRepository.createQueryBuilder('department');
    queryBuilder.where('department.deletedAt IS NULL');

    if (filter.name) {
      queryBuilder.andWhere('department.name LIKE :name', {
        name: `%${filter.name}%`,
      });
    }

    if (filter.code) {
      queryBuilder.andWhere('department.code = :code', {
        code: filter.code,
      });
    }

    if (filter.managerId) {
      queryBuilder.andWhere('department.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    if (filter.parentDepartmentId) {
      queryBuilder.andWhere(
        'department.parentDepartmentId = :parentDepartmentId',
        {
          parentDepartmentId: filter.parentDepartmentId,
        },
      );
    }

    if (filter.externalId) {
      queryBuilder.andWhere('department.externalId = :externalId', {
        externalId: filter.externalId,
      });
    }

    const departments = await queryBuilder.getMany();
    return departments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 옵션에 따라 부서 목록을 조회한다 (페이징, 정렬 포함)
   * @param options 조회 옵션
   * @returns 부서 목록과 총 개수
   */
  async 목록_조회한다(options: DepartmentListOptions = {}): Promise<{
    departments: DepartmentDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'order',
      sortOrder = 'ASC',
      filter = {},
    } = options;

    const queryBuilder =
      this.departmentRepository.createQueryBuilder('department');
    queryBuilder.where('department.deletedAt IS NULL');

    // 필터 적용
    if (filter.name) {
      queryBuilder.andWhere('department.name LIKE :name', {
        name: `%${filter.name}%`,
      });
    }

    if (filter.code) {
      queryBuilder.andWhere('department.code = :code', {
        code: filter.code,
      });
    }

    if (filter.managerId) {
      queryBuilder.andWhere('department.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    if (filter.parentDepartmentId) {
      queryBuilder.andWhere(
        'department.parentDepartmentId = :parentDepartmentId',
        {
          parentDepartmentId: filter.parentDepartmentId,
        },
      );
    }

    if (filter.externalId) {
      queryBuilder.andWhere('department.externalId = :externalId', {
        externalId: filter.externalId,
      });
    }

    // 정렬
    queryBuilder.orderBy(`department.${sortBy}`, sortOrder);

    // 페이징
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [departments, total] = await queryBuilder.getManyAndCount();

    return {
      departments: departments.map((department) => department.DTO로_변환한다()),
      total,
      page,
      limit,
    };
  }

  /**
   * 전체 부서 목록을 조회한다
   * @returns 전체 부서 목록
   */
  async 전체_조회한다(): Promise<DepartmentDto[]> {
    const departments = await this.departmentRepository.find({
      where: { deletedAt: IsNull() },
      order: { order: 'ASC', name: 'ASC' },
    });

    return departments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 최상위 부서 목록을 조회한다
   * @returns 최상위 부서 목록
   */
  async 최상위_부서_조회한다(): Promise<DepartmentDto[]> {
    const departments = await this.departmentRepository.find({
      where: { parentDepartmentId: IsNull(), deletedAt: IsNull() },
      order: { order: 'ASC', name: 'ASC' },
    });

    return departments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 하위 부서 목록을 조회한다
   * @param parentDepartmentId 상위 부서 ID
   * @returns 하위 부서 목록
   */
  async 하위_부서_조회한다(
    parentDepartmentId: string,
  ): Promise<DepartmentDto[]> {
    const departments = await this.departmentRepository.find({
      where: { parentDepartmentId, deletedAt: IsNull() },
      order: { order: 'ASC', name: 'ASC' },
    });

    return departments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 매니저별 부서 목록을 조회한다
   * @param managerId 매니저 ID
   * @returns 매니저 부서 목록
   */
  async 매니저별_조회한다(managerId: string): Promise<DepartmentDto[]> {
    const departments = await this.departmentRepository.find({
      where: { managerId, deletedAt: IsNull() },
      order: { order: 'ASC', name: 'ASC' },
    });

    return departments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 부서가 존재하는지 확인한다
   * @param id 부서 ID
   * @returns 존재 여부
   */
  async 존재하는가(id: string): Promise<boolean> {
    const count = await this.departmentRepository.count({
      where: { id, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * 부서 코드가 존재하는지 확인한다
   * @param code 부서 코드
   * @returns 존재 여부
   */
  async 부서코드가_존재하는가(code: string): Promise<boolean> {
    const count = await this.departmentRepository.count({
      where: { code, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * 외부 ID가 존재하는지 확인한다
   * @param externalId 외부 시스템 ID
   * @returns 존재 여부
   */
  async 외부ID가_존재하는가(externalId: string): Promise<boolean> {
    const count = await this.departmentRepository.count({
      where: { externalId, deletedAt: IsNull() },
    });
    return count > 0;
  }

  // ========== 엔티티 직접 반환 메서드 (컨텍스트에서 사용) ==========

  /**
   * ID로 부서 엔티티를 조회한다
   * @param id 부서 ID
   * @returns 부서 엔티티 (없으면 null)
   */
  async findById(id: string): Promise<Department | null> {
    return this.departmentRepository.findOne({
      where: { id },
    });
  }

  /**
   * 외부 ID로 부서 엔티티를 조회한다
   * @param externalId 외부 시스템 ID
   * @returns 부서 엔티티 (없으면 null)
   */
  async findByExternalId(externalId: string): Promise<Department | null> {
    return this.departmentRepository.findOne({
      where: { externalId },
    });
  }

  /**
   * 모든 부서 엔티티를 조회한다
   * @returns 부서 엔티티 목록
   */
  async findAll(): Promise<Department[]> {
    return this.departmentRepository.find({
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  /**
   * 필터 조건으로 부서 엔티티를 조회한다
   * @param filter 필터 조건
   * @returns 부서 엔티티 목록
   */
  async findByFilter(filter: DepartmentFilter): Promise<Department[]> {
    const queryBuilder =
      this.departmentRepository.createQueryBuilder('department');

    if (filter.name) {
      queryBuilder.andWhere('department.name LIKE :name', {
        name: `%${filter.name}%`,
      });
    }

    if (filter.code) {
      queryBuilder.andWhere('department.code = :code', { code: filter.code });
    }

    if (filter.managerId) {
      queryBuilder.andWhere('department.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    if (filter.parentDepartmentId) {
      queryBuilder.andWhere(
        'department.parentDepartmentId = :parentDepartmentId',
        { parentDepartmentId: filter.parentDepartmentId },
      );
    }

    if (filter.externalId) {
      queryBuilder.andWhere('department.externalId = :externalId', {
        externalId: filter.externalId,
      });
    }

    return queryBuilder
      .orderBy('department.order', 'ASC')
      .addOrderBy('department.name', 'ASC')
      .getMany();
  }

  /**
   * 부서 엔티티를 저장한다
   * @param department 부서 엔티티
   * @returns 저장된 부서 엔티티
   */
  async save(department: Department): Promise<Department> {
    return this.departmentRepository.save(department);
  }

  /**
   * 여러 부서 엔티티를 일괄 저장한다
   * @param departments 부서 엔티티 배열
   * @returns 저장된 부서 엔티티 배열
   */
  async saveMany(departments: Department[]): Promise<Department[]> {
    return this.departmentRepository.save(departments);
  }

  /**
   * 부서 코드로 부서 엔티티를 조회한다
   * @param code 부서 코드
   * @returns 부서 엔티티 (없으면 null)
   */
  async findByCode(code: string): Promise<Department | null> {
    return this.departmentRepository.findOne({
      where: { code },
    });
  }

  /**
   * 상위 부서별 하위 부서 엔티티를 조회한다
   * @param parentDepartmentId 상위 부서 ID
   * @returns 하위 부서 엔티티 목록
   */
  async findByParentDepartmentId(
    parentDepartmentId: string,
  ): Promise<Department[]> {
    return this.departmentRepository.find({
      where: { parentDepartmentId },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  /**
   * 루트 부서 목록을 조회한다 (상위 부서가 없는 부서)
   * @returns 루트 부서 엔티티 목록
   */
  async findRootDepartments(): Promise<Department[]> {
    return this.departmentRepository
      .createQueryBuilder('department')
      .where('department.parentDepartmentId IS NULL')
      .orderBy('department.order', 'ASC')
      .addOrderBy('department.name', 'ASC')
      .getMany();
  }

  /**
   * 부서 통계를 조회한다
   * @returns 부서 통계
   */
  async getDepartmentStats(): Promise<DepartmentStatistics> {
    const totalDepartments = await this.departmentRepository.count();

    const rootDepartments = await this.departmentRepository
      .createQueryBuilder('department')
      .where('department.parentDepartmentId IS NULL')
      .getCount();

    const lastSyncRecord = await this.departmentRepository
      .createQueryBuilder('department')
      .select('department.lastSyncAt')
      .where('department.lastSyncAt IS NOT NULL')
      .orderBy('department.lastSyncAt', 'DESC')
      .limit(1)
      .getOne();

    const subDepartments = totalDepartments - rootDepartments;

    return {
      totalDepartments,
      rootDepartments,
      subDepartments,
      employeesByDepartment: {}, // 복잡한 조인이 필요하므로 추후 구현
      averageEmployeesPerDepartment: 0, // 복잡한 조인이 필요하므로 추후 구현
      lastSyncAt: lastSyncRecord?.lastSyncAt,
    };
  }

  /**
   * 부서 엔티티를 업데이트한다
   * @param id 부서 ID
   * @param partialDepartment 업데이트할 부분 데이터
   * @returns 업데이트된 부서 엔티티
   */
  async update(
    id: string,
    partialDepartment: Partial<Department>,
  ): Promise<Department> {
    await this.departmentRepository.update(id, partialDepartment);
    const department = await this.findById(id);
    if (!department) {
      throw new Error(`부서를 찾을 수 없습니다: ${id}`);
    }
    return department;
  }
}
