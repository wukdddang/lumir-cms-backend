import { News } from '@domain/core/news/news.entity';
import {
  CreateNewsDto as BaseCreateNewsDto,
} from '@interface/common/dto/news/create-news.dto';
import {
  UpdateNewsDto as BaseUpdateNewsDto,
  UpdateNewsPublicDto as BaseUpdateNewsPublicDto,
  UpdateNewsOrderDto as BaseUpdateNewsOrderDto,
  UpdateNewsFileDto as BaseUpdateNewsFileDto,
} from '@interface/common/dto/news/update-news.dto';

// Re-export base types
export { NewsAttachmentDto } from '@interface/common/dto/news/create-news.dto';

/**
 * 뉴스 생성 DTO (Context Layer용 - createdBy 포함)
 */
export interface CreateNewsDto extends BaseCreateNewsDto {
  createdBy?: string;
}

/**
 * 뉴스 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateNewsDto extends BaseUpdateNewsDto {
  updatedBy?: string;
}

/**
 * 뉴스 공개 상태 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateNewsPublicDto extends BaseUpdateNewsPublicDto {
  updatedBy?: string;
}

/**
 * 뉴스 오더 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateNewsOrderDto extends BaseUpdateNewsOrderDto {
  updatedBy?: string;
}

/**
 * 뉴스 파일 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateNewsFileDto extends BaseUpdateNewsFileDto {
  updatedBy?: string;
}

/**
 * 뉴스 생성 결과
 */
export interface CreateNewsResult {
  id: string;
  isPublic: boolean;
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
