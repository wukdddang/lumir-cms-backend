import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import {
  CreateBrochureDto as BaseCreateBrochureDto,
} from '@interface/common/dto/brochure/create-brochure.dto';
import {
  UpdateBrochureDto as BaseUpdateBrochureDto,
  UpdateBrochurePublicDto as BaseUpdateBrochurePublicDto,
  UpdateBrochureOrderDto as BaseUpdateBrochureOrderDto,
  UpdateBrochureFileDto as BaseUpdateBrochureFileDto,
} from '@interface/common/dto/brochure/update-brochure.dto';

// Re-export base types
export {
  BrochureAttachmentDto,
  CreateBrochureTranslationDto,
} from '@interface/common/dto/brochure/create-brochure.dto';
export { UpdateBrochureTranslationDto } from '@interface/common/dto/brochure/update-brochure.dto';

/**
 * 브로슈어 생성 DTO (Context Layer용 - createdBy 포함)
 */
export interface CreateBrochureDto extends BaseCreateBrochureDto {
  createdBy?: string;
}

/**
 * 브로슈어 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateBrochureDto extends BaseUpdateBrochureDto {
  updatedBy?: string;
}

/**
 * 브로슈어 공개 상태 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateBrochurePublicDto extends BaseUpdateBrochurePublicDto {
  updatedBy?: string;
}

/**
 * 브로슈어 오더 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateBrochureOrderDto extends BaseUpdateBrochureOrderDto {
  updatedBy?: string;
}

/**
 * 브로슈어 파일 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateBrochureFileDto extends BaseUpdateBrochureFileDto {
  updatedBy?: string;
}

/**
 * 브로슈어 생성 결과
 */
export interface CreateBrochureResult {
  id: string;
  isPublic: boolean;
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
