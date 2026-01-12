import { News } from '@domain/core/news/news.entity';
import { ContentStatus } from '@domain/core/content-status.types';

/**
 * 뉴스 생성 DTO
 */
export interface CreateNewsDto {
  title: string;
  description?: string | null;
  url?: string | null;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  createdBy?: string;
}

/**
 * 뉴스 수정 DTO
 */
export interface UpdateNewsDto {
  title?: string;
  description?: string | null;
  url?: string | null;
  isPublic?: boolean;
  status?: ContentStatus;
  order?: number;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  updatedBy?: string;
}

/**
 * 뉴스 공개 상태 수정 DTO
 */
export interface UpdateNewsPublicDto {
  isPublic: boolean;
  updatedBy?: string;
}

/**
 * 뉴스 오더 수정 DTO
 */
export interface UpdateNewsOrderDto {
  order: number;
  updatedBy?: string;
}

/**
 * 뉴스 파일 수정 DTO
 */
export interface UpdateNewsFileDto {
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  updatedBy?: string;
}

/**
 * 뉴스 생성 결과
 */
export interface CreateNewsResult {
  id: string;
  isPublic: boolean;
  status: ContentStatus;
  order: number;
  createdAt: Date;
}

/**
 * 뉴스 목록 조회 결과
 */
export interface NewsListResult {
  items: News[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 뉴스 상세 조회 결과
 */
export interface NewsDetailResult extends News {}
