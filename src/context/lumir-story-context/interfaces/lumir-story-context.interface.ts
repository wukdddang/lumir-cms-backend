import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';
import { ContentStatus } from '@domain/core/content-status.types';

/**
 * 루미르스토리 생성 DTO
 */
export interface CreateLumirStoryDto {
  title: string;
  content: string;
  imageUrl?: string | null;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  createdBy?: string;
}

/**
 * 루미르스토리 수정 DTO
 */
export interface UpdateLumirStoryDto {
  title?: string;
  content?: string;
  imageUrl?: string | null;
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
 * 루미르스토리 공개 상태 수정 DTO
 */
export interface UpdateLumirStoryPublicDto {
  isPublic: boolean;
  updatedBy?: string;
}

/**
 * 루미르스토리 오더 수정 DTO
 */
export interface UpdateLumirStoryOrderDto {
  order: number;
  updatedBy?: string;
}

/**
 * 루미르스토리 파일 수정 DTO
 */
export interface UpdateLumirStoryFileDto {
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  updatedBy?: string;
}

/**
 * 루미르스토리 생성 결과
 */
export interface CreateLumirStoryResult {
  id: string;
  isPublic: boolean;
  status: ContentStatus;
  order: number;
  createdAt: Date;
}

/**
 * 루미르스토리 목록 조회 결과
 */
export interface LumirStoryListResult {
  items: LumirStory[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 루미르스토리 상세 조회 결과
 */
export interface LumirStoryDetailResult extends LumirStory {}
