import { DepartmentDto } from './department.types';

/**
 * 부서 도메인 인터페이스
 *
 * 현재 Department 엔티티에 구현된 기능을 기반으로 정의합니다.
 * 기본적으로는 데이터 접근과 DTO 변환 기능을 제공합니다.
 */
export interface IDepartment {
  // 기본 속성 (readonly로 엔티티 필드들)
  /** 고유 식별자 */
  readonly id: string;
  /** 부서명 */
  readonly name: string;
  /** 부서 코드 */
  readonly code: string;
  /** 정렬 순서 */
  readonly order: number;
  /** 매니저 ID (외부 시스템) */
  readonly managerId?: string;
  /** 상위 부서 ID (외부 시스템) */
  readonly parentDepartmentId?: string;
  /** 외부 시스템 ID */
  readonly externalId: string;
  /** 외부 시스템 생성일 */
  readonly externalCreatedAt: Date;
  /** 외부 시스템 수정일 */
  readonly externalUpdatedAt: Date;
  /** 마지막 동기화 시간 */
  readonly lastSyncAt?: Date;
}
