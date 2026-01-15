import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';

/**
 * 폴더 생성 DTO
 */
export interface CreateFolderDto {
  name: string;
  parentId?: string | null;
  isPublic?: boolean;
  permissionRankIds?: string[] | null;
  permissionPositionIds?: string[] | null;
  permissionDepartmentIds?: string[] | null;
  order?: number;
  createdBy?: string;
}

/**
 * 파일 생성 DTO
 */
export interface CreateFileDto {
  name: string;
  parentId?: string | null;
  title?: string | null;
  content?: string | null;
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }> | null;
  isPublic?: boolean;
  order?: number;
  createdBy?: string;
}

/**
 * 위키 수정 DTO
 */
export interface UpdateWikiDto {
  name?: string;
  title?: string | null;
  content?: string | null;
  isPublic?: boolean;
  permissionRankIds?: string[] | null;
  permissionPositionIds?: string[] | null;
  permissionDepartmentIds?: string[] | null;
  order?: number;
  updatedBy?: string;
}

/**
 * 위키 파일 수정 DTO
 */
export interface UpdateWikiFileDto {
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }> | null;
  updatedBy?: string;
}

/**
 * 위키 공개 수정 DTO
 */
export interface UpdateWikiPublicDto {
  isPublic: boolean;
  permissionRankIds?: string[] | null;
  permissionPositionIds?: string[] | null;
  permissionDepartmentIds?: string[] | null;
  updatedBy?: string;
}

/**
 * 위키 경로 수정 DTO
 */
export interface UpdateWikiPathDto {
  parentId: string | null;
  updatedBy?: string;
}

/**
 * 폴더 구조 결과
 */
export interface FolderStructureResult {
  wiki: WikiFileSystem;
  depth: number;
  children?: FolderStructureResult[];
}

/**
 * 생성 결과
 */
export interface CreateWikiResult {
  id: string;
  name: string;
  type: string;
}
