import { EmployeeGender, EmployeeStatus, EmployeeDto } from './employee.types';

/**
 * 직원 도메인 인터페이스
 *
 * 현재 Employee 엔티티에 구현된 기능을 기반으로 정의합니다.
 * 기본적으로는 데이터 접근과 DTO 변환 기능을 제공합니다.
 */
export interface IEmployee {
  // 기본 속성 (readonly로 엔티티 필드들)
  /** 고유 식별자 */
  readonly id: string;
  /** 직원 번호 */
  readonly employeeNumber: string;
  /** 직원명 */
  readonly name: string;
  /** 이메일 */
  readonly email: string;
  /** 전화번호 */
  readonly phoneNumber?: string;
  /** 생년월일 */
  readonly dateOfBirth?: Date;
  /** 성별 */
  readonly gender?: EmployeeGender;
  /** 입사일 */
  readonly hireDate?: Date;
  /** 매니저 ID (외부 시스템) */
  readonly managerId?: string;
  /** 직원 상태 */
  readonly status: EmployeeStatus;
  /** 부서 ID (외부 시스템) */
  readonly departmentId?: string;
  /** 부서명 */
  readonly departmentName?: string;
  /** 부서 코드 */
  readonly departmentCode?: string;
  /** 직급 ID (외부 시스템) */
  readonly positionId?: string;
  /** 직책 ID (외부 시스템) */
  readonly rankId?: string;
  /** 직책명 */
  readonly rankName?: string;
  /** 직책 코드 */
  readonly rankCode?: string;
  /** 직책 레벨 */
  readonly rankLevel?: number;
  /** 외부 시스템 ID */
  readonly externalId: string;
  /** 외부 시스템 생성일 */
  readonly externalCreatedAt: Date;
  /** 외부 시스템 수정일 */
  readonly externalUpdatedAt: Date;
  /** 마지막 동기화 시간 */
  readonly lastSyncAt?: Date;
  /** EMS-PROD 시스템 역할 목록 */
  readonly roles?: string[];
  /** 목록 조회 제외 여부 */
  readonly isExcludedFromList: boolean;
  /** 조회 제외 사유 */
  readonly excludeReason?: string | null;
  /** 조회 제외 설정자 */
  readonly excludedBy?: string | null;
  /** 조회 제외 설정 일시 */
  readonly excludedAt?: Date | null;
  /** 시스템 접근 가능 여부 (관리자 기능 접근 가능 여부) */
  readonly isAccessible: boolean;
}
