/**
 * 직원 관련 타입 정의
 */

// 직원 성별 enum
export type EmployeeGender = 'MALE' | 'FEMALE';

// 직원 상태 enum
export type EmployeeStatus = '재직중' | '휴직중' | '퇴사';

/**
 * 직원 DTO
 * Employee 엔티티와 BaseEntity의 필드를 모두 포함한 완전한 직원 정보
 */
export interface EmployeeDto {
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

  // Employee 엔티티 필드들
  /** 직원 번호 */
  employeeNumber: string;
  /** 직원명 */
  name: string;
  /** 이메일 */
  email: string;
  /** 전화번호 */
  phoneNumber?: string;
  /** 생년월일 */
  dateOfBirth?: Date;
  /** 성별 */
  gender?: EmployeeGender;
  /** 입사일 */
  hireDate?: Date;
  /** 매니저 ID (외부 시스템) */
  managerId?: string;
  /** 직원 상태 */
  status: EmployeeStatus;
  /** 부서 ID (외부 시스템) */
  departmentId?: string;
  /** 부서명 */
  departmentName?: string;
  /** 부서 코드 */
  departmentCode?: string;
  /** 직급 ID (외부 시스템) */
  positionId?: string;
  /** 직책 ID (외부 시스템) */
  rankId?: string;
  /** 직책명 */
  rankName?: string;
  /** 직책 코드 */
  rankCode?: string;
  /** 직책 레벨 */
  rankLevel?: number;
  /** 외부 시스템 ID */
  externalId: string;
  /** 외부 시스템 생성일 */
  externalCreatedAt: Date;
  /** 외부 시스템 수정일 */
  externalUpdatedAt: Date;
  /** 마지막 동기화 시간 */
  lastSyncAt?: Date;
  /** EMS-PROD 시스템 역할 목록 */
  roles?: string[];
  /** 목록 조회 제외 여부 */
  isExcludedFromList: boolean;
  /** 조회 제외 사유 */
  excludeReason?: string | null;
  /** 조회 제외 설정자 */
  excludedBy?: string | null;
  /** 조회 제외 설정 일시 */
  excludedAt?: Date | null;
  /** 시스템 접근 가능 여부 (관리자 기능 접근 가능 여부) */
  isAccessible: boolean;

  // 조인된 정보 필드들
  /** 직급 이름 */
  positionName?: string;
  /** 매니저 이름 */
  managerName?: string;

  // 계산된 필드들 (읽기 전용)
  /** 삭제된 상태 여부 */
  readonly isDeleted: boolean;
  /** 새로 생성된 항목 여부 */
  readonly isNew: boolean;
  /** 재직중 여부 */
  readonly isActive: boolean;
  /** 휴직중 여부 */
  readonly isOnLeave: boolean;
  /** 퇴사 여부 */
  readonly isResigned: boolean;
  /** 남성 여부 */
  readonly isMale: boolean;
  /** 여성 여부 */
  readonly isFemale: boolean;
  /** 근속 연수 */
  readonly yearsOfService: number;
  /** 동기화 필요 여부 */
  readonly needsSync: boolean;
}

// 외부 API 응답 - 직급 정보
export interface ExternalPositionData {
  _id: string;
  position_title: string;
  position_code: string;
  level: number;
}

// 외부 API 응답 - 직책 정보
export interface ExternalRankData {
  _id: string;
  rank_name: string;
  rank_code: string;
  level: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  id?: string;
}

// 외부 API 응답 - 부서 정보
export interface ExternalDepartmentData {
  _id: string;
  department_name: string;
  department_code: string;
  order: number;
  parent_department_id: string;
}

// 외부 API 응답 - 직원 데이터
export interface ExternalEmployeeData {
  _id: string;
  employee_number: string;
  name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  gender: EmployeeGender;
  hire_date: string;
  manager_id: string | null;
  status: EmployeeStatus;
  department_history: any[];
  position_history: any[];
  rank_history: any[];
  created_at: string;
  updated_at: string;
  __v: number;
  position: ExternalPositionData;
  rank: ExternalRankData;
  department: ExternalDepartmentData;
}

// 직원 생성 DTO
export interface CreateEmployeeDto {
  employeeNumber: string;
  name: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: EmployeeGender;
  hireDate?: Date;
  managerId?: string;
  status: EmployeeStatus;
  departmentId?: string;
  departmentName?: string;
  departmentCode?: string;
  positionId?: string;
  rankId?: string;
  rankName?: string;
  rankCode?: string;
  rankLevel?: number;
  externalId: string;
  externalCreatedAt: Date;
  externalUpdatedAt: Date;
  roles?: string[]; // EMS-PROD 시스템 역할 목록 (SSO 로그인 시 설정)
}

// 직원 업데이트 DTO
export interface UpdateEmployeeDto {
  name?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: EmployeeGender;
  hireDate?: Date;
  managerId?: string;
  status?: EmployeeStatus;
  departmentId?: string;
  departmentName?: string;
  departmentCode?: string;
  positionId?: string;
  rankId?: string;
  rankName?: string;
  rankCode?: string;
  rankLevel?: number;
  externalUpdatedAt?: Date;
  lastSyncAt?: Date;
  roles?: string[]; // EMS-PROD 시스템 역할 목록
  isExcludedFromList?: boolean;
  excludeReason?: string | null;
  excludedBy?: string | null;
  excludedAt?: Date | null;
  isAccessible?: boolean;
}

// 직원 동기화 결과
export interface EmployeeSyncResult {
  success: boolean;
  totalProcessed: number;
  created: number;
  updated: number;
  errors: string[];
  syncedAt: Date;
}

// 직원 조회 필터
export interface EmployeeFilter {
  departmentId?: string;
  positionId?: string;
  rankId?: string;
  status?: EmployeeStatus;
  gender?: EmployeeGender;
  managerId?: string;
  includeExcluded?: boolean; // true면 제외된 직원도 포함, false면 제외 (기본값: false)
}

// 직원 통계
export interface EmployeeStatistics {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  resignedEmployees: number;
  employeesByDepartment: Record<string, number>;
  employeesByPosition: Record<string, number>;
  employeesByRank: Record<string, number>;
  employeesByGender: Record<string, number>;
  employeesByStatus: Record<string, number>;
  lastSyncAt?: Date;
}

// 직원 목록 조회 옵션
export interface EmployeeListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'employeeNumber' | 'hireDate' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
  filter?: EmployeeFilter;
}
