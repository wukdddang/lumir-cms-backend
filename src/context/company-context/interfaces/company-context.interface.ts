/**
 * 조직 정보 인터페이스 (SSO)
 */
export interface OrganizationInfo {
  departments: Department[];
}

/**
 * 부서 정보 인터페이스
 */
export interface Department {
  id: string;
  departmentName: string;
  departmentCode: string;
  type: string;
  parentDepartmentId: string | null;
  order: number;
  isActive: boolean;
  isException: boolean;
  employees?: Employee[];
  childDepartments?: Department[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 직원 정보 인터페이스
 */
export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  phoneNumber: string;
  positionId: string;
  positionTitle: string;
  rankId: string;
  rankName: string;
  isManager: boolean;
  metadata: any | null;
}

/**
 * 부서 목록 조회 결과
 */
export interface DepartmentListResult {
  departments: Department[];
}

/**
 * 직급 정보 인터페이스
 */
export interface Rank {
  id: string;
  rankName: string;
  rankCode: string;
  level: number;
  isActive?: boolean;
}

/**
 * 직책 정보 인터페이스
 */
export interface Position {
  id: string;
  positionTitle: string;
  positionCode: string;
  level: number;
  hasManagementAuthority: boolean;
  isActive?: boolean;
}

/**
 * 직급 목록 조회 결과
 */
export type RankListResult = Rank[];

/**
 * 직책 목록 조회 결과
 */
export type PositionListResult = Position[];
