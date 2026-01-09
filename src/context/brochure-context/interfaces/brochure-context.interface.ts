import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import { ContentStatus } from '@domain/core/content-status.types';
import { LanguageCode } from '@domain/common/language/language-code.types';

/**
 * 브로슈어 생성 DTO
 */
export interface CreateBrochureDto {
  isPublic: boolean;
  status: ContentStatus;
  order: number;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  translations: Array<{
    languageId: string;
    title: string;
    description?: string;
  }>;
  createdBy?: string;
}

/**
 * 브로슈어 수정 DTO
 */
export interface UpdateBrochureDto {
  isPublic?: boolean;
  status?: ContentStatus;
  order?: number;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  translations?: Array<{
    languageId: string;
    title: string;
    description?: string;
  }>;
  updatedBy?: string;
}

/**
 * 브로슈어 공개 상태 수정 DTO
 */
export interface UpdateBrochurePublicDto {
  isPublic: boolean;
  updatedBy?: string;
}

/**
 * 브로슈어 오더 수정 DTO
 */
export interface UpdateBrochureOrderDto {
  order: number;
  updatedBy?: string;
}

/**
 * 브로슈어 카테고리 수정 DTO
 */
export interface UpdateBrochureCategoryDto {
  categoryIds: string[];
  updatedBy?: string;
}

/**
 * 브로슈어 파일 수정 DTO
 */
export interface UpdateBrochureFileDto {
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  updatedBy?: string;
}

/**
 * 브로슈어 생성 결과
 */
export interface CreateBrochureResult {
  id: string;
  isPublic: boolean;
  status: ContentStatus;
  order: number;
  createdAt: Date;
}

/**
 * 브로슈어 목록 조회 결과
 */
export interface BrochureListResult {
  items: Brochure[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 브로슈어 상세 조회 결과
 */
export interface BrochureDetailResult extends Brochure {
  translations: BrochureTranslation[];
}

/**
 * 브로슈어 카테고리 목록 조회 결과
 */
export interface BrochureCategoryListResult {
  items: Array<{
    id: string;
    name: string;
    brochureCount: number;
  }>;
  total: number;
}
