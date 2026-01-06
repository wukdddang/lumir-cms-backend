import type { Announcement } from '@domain/core/announcement/announcement.entity';
import type { CreateAnnouncementDto } from '@interface/announcement/dto/announcement.dto';
import type { EmployeeDto } from '@domain/common/employee/employee.types';
import { ContentStatus } from '@domain/core/common/types/status.types';

// 기본 직원 데이터 (employeeFixture 대신 직접 정의)
const defaultEmployee: Partial<EmployeeDto> = {
  id: 'emp-manager-001',
  name: '김관리자',
  email: 'manager@lumir.com',
  employeeNumber: 'EMP-001',
  positionId: 'pos-001',
  positionName: '팀장',
  rankId: 'rank-001',
  rankName: '과장',
  departmentId: 'dept-001',
  departmentName: '경영지원팀',
  status: '재직중',
  externalId: 'ext-001',
  externalCreatedAt: new Date(),
  externalUpdatedAt: new Date(),
  isAccessible: true,
  isExcludedFromList: false,
  isDeleted: false,
  isNew: false,
  isActive: true,
  isOnLeave: false,
  isResigned: false,
  isMale: true,
  isFemale: false,
  yearsOfService: 5,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * 공지사항 테스트 Fixture
 *
 * 테스트에서 사용할 공지사항 샘플 데이터를 제공합니다.
 */

// 기본 공지사항 데이터
export const announcementFixture = {
  title: '2024년 1월 정기 공지사항',
  content: '다음 주 월요일은 전사 워크샵이 있습니다. 참석 부탁드립니다.',
  isFixed: false,
  category: {
    id: 'cat-001',
    name: '일반',
    description: '일반 공지사항',
  },
  mustRead: true,
  status: ContentStatus.DRAFT,
  attachments: ['https://storage.example.com/file1.pdf'],
  employees: [
    {
      id: 'emp-001',
      name: '김철수',
      isRead: false,
      isSubmitted: false,
    },
    {
      id: 'emp-002',
      name: '이영희',
      isRead: false,
      isSubmitted: false,
    },
  ],
};

// 생성 DTO
export const createAnnouncementDtoFixture: CreateAnnouncementDto = {
  title: announcementFixture.title,
  content: announcementFixture.content,
  isFixed: announcementFixture.isFixed,
  category: announcementFixture.category,
  mustRead: announcementFixture.mustRead,
  managerId: defaultEmployee.id!,
  attachments: announcementFixture.attachments,
  employeeIds: ['emp-001', 'emp-002'],
};

// 다른 공지사항 데이터
export const anotherAnnouncementFixture = {
  title: '긴급 공지사항',
  content: '긴급 공지사항입니다. 확인 바랍니다.',
  isFixed: true,
  category: {
    id: 'cat-002',
    name: '긴급',
    description: '긴급 공지사항',
  },
  mustRead: true,
  status: ContentStatus.OPENED,
  attachments: [],
  employees: [],
};

// 만료된 공지사항 데이터
export const expiredAnnouncementFixture = {
  title: '만료된 공지사항',
  content: '이미 만료된 공지사항입니다.',
  isFixed: false,
  category: {
    id: 'cat-001',
    name: '일반',
    description: '일반 공지사항',
  },
  mustRead: false,
  status: ContentStatus.OPENED,
  releasedAt: new Date('2024-01-01'),
  expiredAt: new Date('2024-01-10'),
  attachments: [],
  employees: [],
};

/**
 * Mock Announcement Entity를 생성합니다
 */
export function createMockAnnouncement(
  overrides?: Partial<Announcement>,
): Partial<Announcement> {
  return {
    id: 'ann-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: defaultEmployee.id,
    updatedBy: defaultEmployee.id,
    version: 1,
    title: announcementFixture.title,
    content: announcementFixture.content,
    isFixed: announcementFixture.isFixed,
    category: announcementFixture.category,
    mustRead: announcementFixture.mustRead,
    status: announcementFixture.status,
    hits: 0,
    attachments: announcementFixture.attachments,
    employees: announcementFixture.employees,
    manager: {
      id: defaultEmployee.id!,
      name: defaultEmployee.name!,
      email: defaultEmployee.email!,
      employeeNumber: defaultEmployee.employeeNumber!,
      status: defaultEmployee.status!,
      externalId: defaultEmployee.externalId!,
      externalCreatedAt: defaultEmployee.externalCreatedAt!,
      externalUpdatedAt: defaultEmployee.externalUpdatedAt!,
      isAccessible: defaultEmployee.isAccessible!,
      isExcludedFromList: defaultEmployee.isExcludedFromList!,
      DTO로_변환한다: () => defaultEmployee as EmployeeDto,
    } as any,
    DTO로_변환한다: jest.fn().mockReturnValue({
      id: 'ann-001',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: defaultEmployee.id,
      updatedBy: defaultEmployee.id,
      version: 1,
      title: announcementFixture.title,
      content: announcementFixture.content,
      isFixed: announcementFixture.isFixed,
      category: announcementFixture.category,
      mustRead: announcementFixture.mustRead,
      status: announcementFixture.status,
      hits: 0,
      attachments: announcementFixture.attachments,
      employees: announcementFixture.employees,
      manager: defaultEmployee,
      isDeleted: false,
      isNew: false,
      isExpired: false,
    }),
    조회수를_증가한다: jest.fn(),
    직원이_읽음_처리한다: jest.fn(),
    직원이_응답을_제출한다: jest.fn(),
    ...overrides,
  };
}
