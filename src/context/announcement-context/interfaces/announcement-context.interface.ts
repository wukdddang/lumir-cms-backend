import { Announcement } from '@domain/core/announcement/announcement.entity';

/**
 * 공지사항 생성 DTO
 */
export interface CreateAnnouncementDto {
  title: string;
  content: string;
  isFixed?: boolean;
  isPublic?: boolean;
  releasedAt?: Date | null;
  expiredAt?: Date | null;
  mustRead?: boolean;
  permissionEmployeeIds?: string[] | null;
  permissionRankCodes?: string[] | null;
  permissionPositionCodes?: string[] | null;
  permissionDepartmentCodes?: string[] | null;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }> | null;
  createdBy?: string;
}

/**
 * 공지사항 수정 DTO
 */
export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  isFixed?: boolean;
  isPublic?: boolean;
  releasedAt?: Date | null;
  expiredAt?: Date | null;
  mustRead?: boolean;
  permissionEmployeeIds?: string[] | null;
  permissionRankCodes?: string[] | null;
  permissionPositionCodes?: string[] | null;
  permissionDepartmentCodes?: string[] | null;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }> | null;
  order?: number;
  updatedBy?: string;
}

/**
 * 공지사항 공개 상태 수정 DTO
 */
export interface UpdateAnnouncementPublicDto {
  isPublic: boolean;
  updatedBy?: string;
}

/**
 * 공지사항 고정 상태 수정 DTO
 */
export interface UpdateAnnouncementFixedDto {
  isFixed: boolean;
  updatedBy?: string;
}

/**
 * 공지사항 오더 수정 DTO
 */
export interface UpdateAnnouncementOrderDto {
  order: number;
  updatedBy?: string;
}

/**
 * 공지사항 오더 일괄 수정 DTO
 */
export interface UpdateAnnouncementBatchOrderDto {
  announcements: Array<{ id: string; order: number }>;
  updatedBy?: string;
}

/**
 * 공지사항 생성 결과
 */
export interface CreateAnnouncementResult {
  id: string;
  isPublic: boolean;
  isFixed: boolean;
  order: number;
  createdAt: Date;
}

/**
 * 공지사항 목록 조회 결과
 */
export interface AnnouncementListResult {
  items: Announcement[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 공지사항 상세 조회 결과
 */
export interface AnnouncementDetailResult extends Announcement {}
