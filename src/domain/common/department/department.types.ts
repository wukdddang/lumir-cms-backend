/**
 * 부서 관련 타입 정의
 */

/**
 * 부서 DTO
 * Department 엔티티와 BaseEntity의 필드를 모두 포함한 완전한 부서 정보
 */
export interface DepartmentDto {
  // BaseEntity 필드들
  /** 고유 식별자 (UUID) */
  id: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 (소프트 삭제) */
  deletedAt?: Date;
  /** 생성자 ID */
  createdBy?: string;
  /** 수정자 ID */
  updatedBy?: string;
  /** 버전 (낙관적 잠금용) */
  version: number;

  // Department 엔티티 필드들
  /** 부서명 */
  name: string;
  /** 부서 코드 */
  code: string;
  /** 순서 */
  order: number;
  /** 매니저 ID (외부 시스템) */
  managerId?: string;
  /** 상위 부서 ID (외부 시스템) */
  parentDepartmentId?: string;
  /** 외부 시스템 ID */
  externalId: string;
  /** 외부 시스템 생성일 */
  externalCreatedAt: Date;
  /** 외부 시스템 수정일 */
  externalUpdatedAt: Date;
  /** 마지막 동기화 시간 */
  lastSyncAt?: Date;

  // 조인된 정보 필드들
  /** 매니저 이름 */
  managerName?: string;
  /** 상위 부서 이름 */
  parentDepartmentName?: string;
  /** 하위 부서 수 */
  childDepartmentCount?: number;
  /** 소속 직원 수 */
  employeeCount?: number;

  // 계산된 필드들 (읽기 전용)
  /** 삭제된 상태 여부 */
  readonly isDeleted: boolean;
  /** 새로 생성된 항목 여부 */
  readonly isNew: boolean;
  /** 최상위 부서 여부 */
  readonly isRootDepartment: boolean;
  /** 하위 부서 존재 여부 */
  readonly hasChildren: boolean;
  /** 동기화 필요 여부 */
  readonly needsSync: boolean;
}

// 부서 생성 DTO
export interface CreateDepartmentDto {
  name: string;
  code: string;
  externalId: string;
  order?: number;
  managerId?: string;
  parentDepartmentId?: string;
  externalCreatedAt: Date;
  externalUpdatedAt: Date;
}

// 부서 업데이트 DTO
export interface UpdateDepartmentDto {
  name?: string;
  code?: string;
  order?: number;
  managerId?: string;
  parentDepartmentId?: string;
  externalUpdatedAt?: Date;
  lastSyncAt?: Date;
}

// 부서 조회 필터
export interface DepartmentFilter {
  name?: string;
  code?: string;
  managerId?: string;
  parentDepartmentId?: string;
  externalId?: string;
}

// 부서 통계
export interface DepartmentStatistics {
  totalDepartments: number;
  rootDepartments: number;
  subDepartments: number;
  employeesByDepartment: Record<string, number>;
  averageEmployeesPerDepartment: number;
  lastSyncAt?: Date;
}

// 부서 목록 조회 옵션
export interface DepartmentListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'code' | 'order' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
  filter?: DepartmentFilter;
}

// 동기화 결과
export interface DepartmentSyncResult {
  success: boolean;
  totalProcessed: number;
  created: number;
  updated: number;
  errors: string[];
  syncedAt: Date;
}
