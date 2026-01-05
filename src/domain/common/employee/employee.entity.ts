import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import type {
  EmployeeGender,
  EmployeeStatus,
  EmployeeDto,
} from './employee.types';
import { IEmployee } from './employee.interface';

/**
 * 직원 엔티티
 *
 * 회사의 직원 정보를 관리합니다.
 * 외부 메타데이터 매니저와 동기화됩니다.
 */
@Entity('employee')
@Index(['externalId'], { unique: true })
export class Employee extends BaseEntity<EmployeeDto> implements IEmployee {
  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: '직원 번호',
  })
  employeeNumber: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '직원명',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    comment: '이메일',
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '전화번호',
  })
  phoneNumber?: string;

  @Column({
    type: 'date',
    nullable: true,
    comment: '생년월일',
  })
  dateOfBirth?: Date;

  @Column({
    type: 'enum',
    enum: ['MALE', 'FEMALE'],
    nullable: true,
    comment: '성별',
  })
  gender?: EmployeeGender;

  @Column({
    type: 'date',
    nullable: true,
    comment: '입사일',
  })
  hireDate?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '매니저 ID (외부 시스템)',
  })
  managerId?: string;

  @Column({
    type: 'enum',
    enum: ['재직중', '휴직중', '퇴사'],
    default: '재직중',
    comment: '직원 상태',
  })
  status: EmployeeStatus;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '부서 ID (외부 시스템)',
  })
  departmentId?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: '부서명',
  })
  departmentName?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '부서 코드',
  })
  departmentCode?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '직급 ID (외부 시스템)',
  })
  positionId?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '직책 ID (외부 시스템)',
  })
  rankId?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '직책명',
  })
  rankName?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '직책 코드',
  })
  rankCode?: string;

  @Column({
    type: 'integer',
    nullable: true,
    comment: '직책 레벨',
  })
  rankLevel?: number;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    comment: '외부 시스템 ID',
  })
  externalId: string;

  @Column({
    type: 'timestamp',
    comment: '외부 시스템 생성일',
  })
  externalCreatedAt: Date;

  @Column({
    type: 'timestamp',
    comment: '외부 시스템 수정일',
  })
  externalUpdatedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '마지막 동기화 시간',
  })
  lastSyncAt?: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'EMS-PROD 시스템 역할 목록',
  })
  roles?: string[];

  @Column({
    type: 'boolean',
    default: false,
    comment: '목록 조회 제외 여부',
  })
  isExcludedFromList: boolean;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '조회 제외 사유',
  })
  excludeReason?: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '조회 제외 설정자',
  })
  excludedBy?: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '조회 제외 설정 일시',
  })
  excludedAt?: Date | null;

  @Column({
    type: 'boolean',
    default: true,
    comment: '시스템 접근 가능 여부 (관리자 기능 접근 가능 여부)',
  })
  isAccessible: boolean;

  constructor(
    employeeNumber?: string,
    name?: string,
    email?: string,
    externalId?: string,
    phoneNumber?: string,
    dateOfBirth?: Date,
    gender?: EmployeeGender,
    hireDate?: Date,
    managerId?: string,
    status?: EmployeeStatus,
    departmentId?: string,
    departmentName?: string,
    departmentCode?: string,
    positionId?: string,
    rankId?: string,
    rankName?: string,
    rankCode?: string,
    rankLevel?: number,
    externalCreatedAt?: Date,
    externalUpdatedAt?: Date,
  ) {
    super();
    if (employeeNumber) this.employeeNumber = employeeNumber;
    if (name) this.name = name;
    if (email) this.email = email;
    if (externalId) this.externalId = externalId;
    if (phoneNumber) this.phoneNumber = phoneNumber;
    if (dateOfBirth) this.dateOfBirth = dateOfBirth;
    if (gender) this.gender = gender;
    if (hireDate) this.hireDate = hireDate;
    if (managerId) this.managerId = managerId;
    if (status) this.status = status;
    if (departmentId) this.departmentId = departmentId;
    if (departmentName) this.departmentName = departmentName;
    if (departmentCode) this.departmentCode = departmentCode;
    if (positionId) this.positionId = positionId;
    if (rankId) this.rankId = rankId;
    if (rankName) this.rankName = rankName;
    if (rankCode) this.rankCode = rankCode;
    if (rankLevel !== undefined) this.rankLevel = rankLevel;
    // externalCreatedAt과 externalUpdatedAt은 기본값 설정
    this.externalCreatedAt = externalCreatedAt || new Date();
    this.externalUpdatedAt = externalUpdatedAt || new Date();
    this.status = status || '재직중';
    this.isExcludedFromList = false; // 기본값: 조회 제외 안 함
    this.isAccessible = true; // 기본값: 접근 가능 (관리자 권한)
  }

  /**
   * Employee 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): EmployeeDto {
    return {
      // BaseEntity 필드들
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      version: this.version,

      // Employee 엔티티 필드들
      employeeNumber: this.employeeNumber,
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      hireDate: this.hireDate,
      managerId: this.managerId,
      status: this.status,
      departmentId: this.departmentId,
      departmentName: this.departmentName,
      departmentCode: this.departmentCode,
      positionId: this.positionId,
      rankId: this.rankId,
      rankName: this.rankName,
      rankCode: this.rankCode,
      rankLevel: this.rankLevel,
      externalId: this.externalId,
      externalCreatedAt: this.externalCreatedAt,
      externalUpdatedAt: this.externalUpdatedAt,
      lastSyncAt: this.lastSyncAt,
      roles: this.roles,
      isExcludedFromList: this.isExcludedFromList,
      excludeReason: this.excludeReason,
      excludedBy: this.excludedBy,
      excludedAt: this.excludedAt,
      isAccessible: this.isAccessible,

      // 계산된 필드들
      get isDeleted() {
        return this.deletedAt !== null && this.deletedAt !== undefined;
      },
      get isNew() {
        return !this.id || this.version === 1;
      },
      get isActive() {
        return this.status === '재직중';
      },
      get isOnLeave() {
        return this.status === '휴직중';
      },
      get isResigned() {
        return this.status === '퇴사';
      },
      get isMale() {
        return this.gender === 'MALE';
      },
      get isFemale() {
        return this.gender === 'FEMALE';
      },
      get yearsOfService() {
        if (!this.hireDate) return 0;
        const now = new Date();
        const hireDate =
          this.hireDate instanceof Date
            ? this.hireDate
            : new Date(this.hireDate);
        const diffTime = Math.abs(now.getTime() - hireDate.getTime());
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
      },
      get needsSync() {
        if (!this.lastSyncAt) return true;
        const now = new Date();
        const diffHours =
          Math.abs(now.getTime() - this.lastSyncAt.getTime()) /
          (1000 * 60 * 60);
        return diffHours >= 24; // 24시간 이상 지났으면 동기화 필요
      },
    };
  }
}
