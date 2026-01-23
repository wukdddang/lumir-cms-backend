import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';
import {
  CreateLumirStoryDto as BaseCreateLumirStoryDto,
} from '@interface/common/dto/lumir-story/create-lumir-story.dto';
import {
  UpdateLumirStoryDto as BaseUpdateLumirStoryDto,
  UpdateLumirStoryPublicDto as BaseUpdateLumirStoryPublicDto,
  UpdateLumirStoryOrderDto as BaseUpdateLumirStoryOrderDto,
  UpdateLumirStoryFileDto as BaseUpdateLumirStoryFileDto,
} from '@interface/common/dto/lumir-story/update-lumir-story.dto';

// Re-export base types
export { LumirStoryAttachmentDto } from '@interface/common/dto/lumir-story/create-lumir-story.dto';

/**
 * 루미르스토리 생성 DTO (Context Layer용 - createdBy 포함)
 */
export interface CreateLumirStoryDto extends BaseCreateLumirStoryDto {
  createdBy?: string;
}

/**
 * 루미르스토리 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateLumirStoryDto extends BaseUpdateLumirStoryDto {
  updatedBy?: string;
}

/**
 * 루미르스토리 공개 상태 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateLumirStoryPublicDto extends BaseUpdateLumirStoryPublicDto {
  updatedBy?: string;
}

/**
 * 루미르스토리 오더 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateLumirStoryOrderDto extends BaseUpdateLumirStoryOrderDto {
  updatedBy?: string;
}

/**
 * 루미르스토리 파일 수정 DTO (Context Layer용 - updatedBy 포함)
 */
export interface UpdateLumirStoryFileDto extends BaseUpdateLumirStoryFileDto {
  updatedBy?: string;
}

/**
 * 루미르스토리 생성 결과
 */
export interface CreateLumirStoryResult {
  id: string;
  isPublic: boolean;
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
